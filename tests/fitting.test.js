import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {fitSls, exponential} from "../src/fitting.js";
const bundle = readFileSync(new URL("../assets/index-BaDyAcaM.js", import.meta.url), "utf8");
const model = bundle.slice(bundle.indexOf("const Zk="), bundle.indexOf("const eE="));
const parser = bundle.slice(bundle.indexOf("const Tx="), bundle.indexOf("function nq("));
const context = vm.createContext({});
vm.runInContext(model + parser + ";this.api={Ka,fc,JG,tq,Xw};", context);
const {Ka,fc,JG,tq,Xw} = context.api;
const settings = {c0:0.2,lp:"1.0",w1:594,w2:405,f:1};
const times = Array.from({length:121},(_,i)=>i*5);
const observations = (p=1.42,tau=60) => times.map(t=>({kind:"sls",t,value:exponential(t,p,tau)}));
const near = (actual,expected,tolerance=1e-6) =>
  assert.ok(Math.abs(actual/expected-1)<tolerance, `${actual} != ${expected}`);
const expectedK0 = (2.13*.0128/60)**(1/.87)*.1/.2;

test("two-stage fit recovers Eq. 12 and Eq. 13, including t=0",()=>{
  const result=fitSls(observations(),settings,Ka);
  assert.equal(result.ok,true);
  near(result.pUnscaled,1.42); near(result.f,1);
  near(result.firstTau,60); near(result.tau,60); near(result.k0,expectedK0);
  assert.ok(result.rmse<1e-8);
});

test("nonunit f is estimated and the second fit really uses the whole rescaled ratio",()=>{
  const result=fitSls(observations(1.6,75),settings,Ka);
  assert.equal(result.ok,true); near(result.firstTau,75); near(result.f,1.6/1.42);
  // Independent brute-force second-stage reference (not the production optimizer).
  const residual = tau => observations(1.6,75).reduce((s,o)=>
    s+(1+.42*(1-Math.exp(-o.t/tau))-o.value/(1.6/1.42))**2,0);
  let best=0,bestError=Infinity;
  for(let tau=1;tau<=300;tau+=.01) {
    const error=residual(tau);
    if(error<bestError){bestError=error;best=tau;}
  }
  assert.ok(Math.abs(result.tau-best)<.02);
  assert.ok(Math.abs(result.tau-result.firstTau)>1);
  near(result.predictions[0].value,1/result.f);
  assert.ok(result.warnings.some(w=>w.includes("baseline")));
});

test("concentration changes recompute k0; manual prediction f does not bias calibration",()=>{
  const a=fitSls(observations(),settings,Ka);
  const b=fitSls(observations(),{...settings,c0:.4,f:1.8},Ka);
  near(b.k0,a.k0/2); near(b.tau,a.tau); near(b.f,a.f);
});

test("all calibrated pairs and their reciprocal inputs recover known times",()=>{
  for(const [key,calibration] of Object.entries(Ka)) {
    const [lp,pair]=key.split("|"), [w1,w2]=pair.split("/").map(Number);
    const data=observations(calibration.p_tilde,40);
    const direct=fitSls(data,{...settings,lp,w1,w2},Ka);
    const reverse=fitSls(data.map(o=>({...o,value:1/o.value})),{...settings,lp,w1:w2,w2:w1},Ka);
    assert.equal(direct.ok,true); assert.equal(reverse.ok,true);
    near(direct.tau,40); near(reverse.tau,40); near(reverse.k0,direct.k0);
  }
});

test("unidentifiable or invalid data do not produce apparently successful fits",()=>{
  for(const data of [observations(1), observations().slice(0,2),
    observations().map(o=>({...o,value:-1})),
    observations().map(o=>({...o,t:10}))]) {
    assert.equal(fitSls(data,settings,Ka).ok,false);
  }
  assert.equal(fitSls(observations(),{...settings,w1:405,w2:365},Ka).ok,false);
});

test("CSV seconds/minutes, zero-time point, and microscopy route remain usable",()=>{
  const seconds=JG("time_s,sls_ratio\n0,1\n60,1.2\n120,1.3\n180,1.4");
  const minutes=JG("time_min,sls_ratio\n0,1\n1,1.2\n2,1.3\n3,1.4");
  assert.equal(seconds.observations.length,4);
  assert.equal(JSON.stringify(seconds.observations),JSON.stringify(minutes.observations));
  const csv="time_s,median_ulf\n"+times.map(t=>`${t},${Xw({...settings,k0:expectedK0},t)}`).join("\n");
  near(tq(JG(csv).observations,settings).k0,expectedK0);
});

test("prediction plateau is independent of k0 and agrees with the fitting reference",()=>{
  for(const k0 of [1e-6,6.3e-5,1e-3]) near(fc({...settings,k0},600).p,1.42);
  near(fc({...settings,k0:expectedK0},60).r,exponential(60,1.42,60));
});
