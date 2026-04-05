'use client';

import { useState } from 'react';

export default function Home() {
  const [view, setView] = useState('input');
  const [decision, setDecision] = useState('');
  const [context, setContext] = useState('');
  const [domain, setDomain] = useState('business');
  const [stakes, setStakes] = useState('high');
  const [timeframe, setTimeframe] = useState('weeks');
  const [confidence, setConfidence] = useState(50);
  const [emotionalState, setEmotionalState] = useState('calm');
  const [expertise, setExpertise] = useState('some');
  const [stakeholders, setStakeholders] = useState('');
  const [priorAttempts, setPriorAttempts] = useState('');
  const [killCriteria, setKillCriteria] = useState('');
  const [reversibility, setReversibility] = useState('unsure');
  const [speed, setSpeed] = useState('moderate');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const M = "'JetBrains Mono', monospace";
  const S = "'Newsreader', serif";
  const steps = ['Classifying complexity...','Building reference class...','Detecting biases...','Computing convexity...','Mapping evidence...','Running scenarios...','Synthesizing verdict...'];

  const pill = (active, onClick, label) => (
    <button key={label} onClick={onClick} style={{padding:'7px 12px',fontSize:'10.5px',fontFamily:M,cursor:'pointer',border:'1px solid '+(active?'rgba(91,157,245,0.4)':'rgba(255,255,255,0.12)'),borderRadius:5,background:active?'rgba(91,157,245,0.07)':'transparent',color:active?'#5B9DF5':'rgba(255,255,255,0.55)',textTransform:'uppercase',whiteSpace:'nowrap',transition:'all 0.2s',letterSpacing:'0.5px'}}>{label}</button>
  );

  const box = (children, accent) => (
    <div style={{padding:18,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,borderLeft:accent?'2.5px solid '+accent:undefined}}>{children}</div>
  );

  const lbl = (text) => (
    <div style={{fontSize:'9.5px',letterSpacing:'2.5px',color:'rgba(255,255,255,0.55)',fontFamily:M,textTransform:'uppercase',marginBottom:10}}>{text}</div>
  );

  const tag = (text, color='rgba(255,255,255,0.5)') => (
    <span style={{display:'inline-block',padding:'2px 7px',fontSize:9,letterSpacing:1,fontFamily:M,color,border:'1px solid '+color+'30',borderRadius:3,textTransform:'uppercase'}}>{text}</span>
  );

  const bar = (value, color) => (
    <div style={{width:'100%',height:3,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
      <div style={{width:Math.min(value,100)+'%',height:'100%',background:color,borderRadius:2,transition:'width 1s ease'}}/>
    </div>
  );

  const inputStyle = {width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'12px 14px',color:'rgba(255,255,255,0.95)',fontSize:14,lineHeight:'1.6',outline:'none',resize:'vertical'};

  const analyze = async () => {
    setView('analyzing'); setStep(0); setError('');
    const interval = setInterval(() => setStep(s => Math.min(s+1, steps.length-1)), 1400);

    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ input: { decision, context, domain, stakes, timeframe, reversibility, stakeholders, priorAttempts, userConfidence: confidence, emotionalState, expertiseLevel: expertise, killCriteria, decisionSpeed: speed }})
      });
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setView('results');
    } catch(e) {
      clearInterval(interval);
      setError(e.message);
      setView('input');
    }
  };

  const tabs = ['EVIDENCE','REF CLASS','CONVEXITY','BIASES','SCENARIOS','VERDICT'];
  const [tab, setTab] = useState(0);
  const A = analysis;
  const cynColors = {simple:'#3DD68C',complicated:'#5B9DF5',complex:'#A78BFA',chaotic:'#EF4444'};
  const scenarioColors = ['#3DD68C','#EAB308','#EF4444','#A78BFA'];

  return (
    <div style={{minHeight:'100vh',background:'#07090D',color:'rgba(255,255,255,0.95)',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{maxWidth:740,margin:'0 auto',padding:'40px 16px 80px'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
          <div>
            <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,255,255,0.35)',fontFamily:M}}>CAPGULL TECHNOLOGIES</div>
            <h1 style={{fontSize:'clamp(28px,5vw,38px)',fontFamily:S,fontWeight:400,lineHeight:1.1,margin:'4px 0'}}>PRISM</h1>
            <div style={{fontSize:9,letterSpacing:1.5,color:'rgba(255,255,255,0.4)',fontFamily:M}}>EVIDENCE-GROUNDED DECISION INTELLIGENCE</div>
          </div>
          {view === 'results' && (
            <button onClick={() => {setView('input');setAnalysis(null);setTab(0)}} style={{padding:'6px 14px',fontSize:10,fontFamily:M,textTransform:'uppercase',cursor:'pointer',borderRadius:5,border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'rgba(255,255,255,0.55)'}}>+ New</button>
          )}
        </div>

        {/* ═══ INPUT ═══ */}
        {view === 'input' && (
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>{lbl('The Decision')}<textarea style={{...inputStyle,minHeight:85}} value={decision} onChange={e=>setDecision(e.target.value)} placeholder="What specific decision are you facing?"/></div>

            <div>{lbl('Domain')}<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{['business','financial','career','health','relationship','technical','legal','other'].map(d=>pill(domain===d,()=>setDomain(d),d))}</div></div>

            <div>{lbl('Context & Constraints')}<textarea style={{...inputStyle,minHeight:60,fontSize:13}} value={context} onChange={e=>setContext(e.target.value)} placeholder="Budget, timeline, dependencies, competitive landscape..."/></div>

            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:140}}>{lbl('Stakes')}<div style={{display:'flex',gap:4}}>{['low','medium','high','existential'].map(s=>pill(stakes===s,()=>setStakes(s),s))}</div></div>
              <div style={{flex:1,minWidth:140}}>{lbl('Timeframe')}<div style={{display:'flex',gap:4}}>{['hours','days','weeks','months','years'].map(t=>pill(timeframe===t,()=>setTimeframe(t),t))}</div></div>
            </div>

            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:140}}>{lbl('Reversibility')}<div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{[['easy','Easy'],['partial','Partial'],['hard','Hard'],['irreversible','No'],['unsure','?']].map(([v,l])=>pill(reversibility===v,()=>setReversibility(v),l))}</div></div>
              <div style={{flex:1,minWidth:140}}>{lbl('Speed')}<div style={{display:'flex',gap:4}}>{['snap','fast','moderate','deliberate'].map(s=>pill(speed===s,()=>setSpeed(s),s))}</div></div>
            </div>

            <div>{lbl('Emotional State')}<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{['calm','excited','anxious','frustrated','uncertain'].map(e=>pill(emotionalState===e,()=>setEmotionalState(e),e))}</div></div>

            <div>{lbl('Expertise')}<div style={{display:'flex',gap:4}}>{[['none','Novice'],['some','Some'],['experienced','Experienced'],['expert','Expert']].map(([v,l])=>pill(expertise===v,()=>setExpertise(v),l))}</div></div>

            <div>{lbl('Confidence: '+confidence+'%')}<input type="range" min={0} max={100} value={confidence} onChange={e=>setConfidence(+e.target.value)} style={{width:'100%',accentColor:'#5B9DF5'}}/><div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,0.45)',fontFamily:M}}><span>No idea</span><span>Certain</span></div></div>

            <div>{lbl('Stakeholders (optional)')}<input style={inputStyle} value={stakeholders} onChange={e=>setStakeholders(e.target.value)} placeholder="Who else is affected?"/></div>

            <div>{lbl('Prior Attempts (optional)')}<textarea style={{...inputStyle,minHeight:50,fontSize:13}} value={priorAttempts} onChange={e=>setPriorAttempts(e.target.value)} placeholder="Tried something similar before?"/></div>

            <div>{lbl('Kill Criteria (optional)')}<textarea style={{...inputStyle,minHeight:50,fontSize:13}} value={killCriteria} onChange={e=>setKillCriteria(e.target.value)} placeholder="If ___ happens, I reverse this decision."/></div>

            {error && <div style={{color:'#EF4444',fontSize:11,fontFamily:M,wordBreak:'break-word',lineHeight:1.5,padding:12,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:6}}>{error}</div>}

            <button onClick={analyze} disabled={!decision.trim()} style={{width:'100%',padding:'14px',fontSize:'10.5px',letterSpacing:'1.5px',fontFamily:M,textTransform:'uppercase',cursor:decision.trim()?'pointer':'default',borderRadius:6,border:'none',fontWeight:500,background:decision.trim()?'linear-gradient(135deg,#1D4ED8,#3B82F6)':'rgba(255,255,255,0.04)',color:decision.trim()?'white':'rgba(255,255,255,0.15)',boxShadow:decision.trim()?'0 4px 20px rgba(29,78,216,0.3)':'none'}}>Run Evidence-Based Analysis →</button>
          </div>
        )}

        {/* ═══ ANALYZING ═══ */}
        {view === 'analyzing' && (
          <div style={{padding:'50px 0',textAlign:'center'}}>
            <div style={{width:40,height:40,margin:'0 auto 24px',border:'2px solid rgba(91,157,245,0.2)',borderTopColor:'#5B9DF5',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {steps.map((s,i)=><p key={i} style={{fontSize:11,fontFamily:M,marginBottom:8,color:i<=step?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.15)',transition:'color 0.3s'}}>{i<step?'✓':i===step?'◉':'○'} {s}</p>)}
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {view === 'results' && A && (
          <div>
            {/* Cynefin + Completeness */}
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              {box(<><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>{tag(A.cynefin?.classification||'?',cynColors[A.cynefin?.classification]||'#5B9DF5')}<span style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M}}>CYNEFIN</span></div><p style={{fontSize:11,color:'rgba(255,255,255,0.75)',lineHeight:1.5}}>{A.cynefin?.implication}</p></>,cynColors[A.cynefin?.classification])}
              {box(<><div style={{fontSize:22,fontWeight:700,fontFamily:M,color:(A.evidenceLayers?.gaps?.completenessScore||0)>=55?'#3DD68C':'#EF4444',textAlign:'center'}}>{A.evidenceLayers?.gaps?.completenessScore||0}%</div><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M,textAlign:'center'}}>DATA</div></>)}
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:4,marginBottom:18,flexWrap:'wrap'}}>
              {tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'6px 10px',fontSize:9,letterSpacing:1.2,cursor:'pointer',border:'1px solid '+(tab===i?'rgba(91,157,245,0.35)':'rgba(255,255,255,0.08)'),borderRadius:3,fontFamily:M,textTransform:'uppercase',whiteSpace:'nowrap',background:tab===i?'rgba(91,157,245,0.06)':'transparent',color:tab===i?'#5B9DF5':'rgba(255,255,255,0.45)'}}>{t}</button>)}
            </div>

            {/* EVIDENCE */}
            {tab===0&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
              {box(<>{lbl('🧬 Internal Patterns')}<p style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.6}}>{A.evidenceLayers?.internal?.expertiseAssessment}</p>{(A.evidenceLayers?.internal?.patternsRelevant||[]).map((p,i)=><div key={i} style={{fontSize:12,color:'rgba(255,255,255,0.75)',padding:'2px 0'}}>→ {p}</div>)}</>,'#A78BFA')}
              {box(<>{lbl('🌐 External Evidence')}{(A.evidenceLayers?.external?.baseRates||[]).map((br,i)=><div key={i} style={{padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}><div style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.5}}>{br.fact}</div><div style={{display:'flex',gap:5,marginTop:3}}>{tag(br.sourceType,'#3DD68C')}{tag(br.confidence,br.confidence==='high'?'#3DD68C':'#EAB308')}</div></div>)}{(A.evidenceLayers?.external?.historicalAnalogues||[]).map((h,i)=><div key={i} style={{padding:'8px 10px',background:'rgba(61,214,140,0.04)',border:'1px solid rgba(61,214,140,0.1)',borderRadius:4,marginTop:8}}><div style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}>{h.situation}</div><div style={{fontSize:11,color:'#3DD68C',fontFamily:M,marginTop:2}}>→ {h.lesson}</div></div>)}</>,'#3DD68C')}
              {box(<>{lbl('⬛ Information Gaps')}{bar(A.evidenceLayers?.gaps?.completenessScore||0,(A.evidenceLayers?.gaps?.completenessScore||0)>=55?'#3DD68C':'#EF4444')}<div style={{fontSize:11,color:'rgba(255,255,255,0.5)',fontFamily:M,margin:'6px 0'}}>{A.evidenceLayers?.gaps?.completenessReasoning}</div>{(A.evidenceLayers?.gaps?.criticalUnknowns||[]).map((u,i)=><div key={i} style={{padding:'6px 10px',background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.1)',borderRadius:4,marginBottom:4}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}>{u.unknown}</span>{tag(u.impact,u.impact==='high'?'#EF4444':'#EAB308')}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:2}}>→ {u.resolution}</div></div>)}</>,'#EF4444')}
            </div>}

            {/* REF CLASS */}
            {tab===1&&<div>{box(<>{lbl('Reference Class (Outside View)')}<div style={{fontSize:14,color:'rgba(255,255,255,0.95)',fontFamily:S,fontStyle:'italic',marginBottom:10,lineHeight:1.5}}>"{A.referenceClass?.classDescription}"</div><div style={{display:'flex',gap:20,marginBottom:10}}><div><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M}}>BASE RATE</div><div style={{fontSize:22,fontWeight:700,fontFamily:M,color:'#EAB308'}}>{A.referenceClass?.baseRateSuccess||'?'}</div></div><div><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M}}>ADJUSTED</div><div style={{fontSize:22,fontWeight:700,fontFamily:M,color:'#5B9DF5'}}>{A.referenceClass?.adjustedEstimate||'?'}</div></div></div>{lbl('Adjustment Factors')}{(A.referenceClass?.adjustmentFactors||[]).map((af,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.08)'}}><span style={{fontSize:12,color:'rgba(255,255,255,0.75)',flex:1}}>{af.factor}</span>{tag(af.direction+'↕',af.direction==='above'?'#3DD68C':'#EF4444')}</div>)}</>,'#5B9DF5')}</div>}

            {/* CONVEXITY */}
            {tab===2&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
              {box(<><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><div>{lbl('Payoff Structure')}<div style={{fontSize:18,fontWeight:600,color:A.convexityAnalysis?.payoffStructure==='convex'?'#3DD68C':'#EF4444',textTransform:'uppercase'}}>{A.convexityAnalysis?.payoffStructure||'?'}</div></div><div style={{textAlign:'right'}}><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M}}>ASYMMETRY</div><div style={{fontSize:20,fontWeight:700,fontFamily:M,color:'rgba(255,255,255,0.95)'}}>{A.convexityAnalysis?.asymmetryRatio||'?'}</div></div></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><div style={{flex:1,padding:8,borderRadius:4,background:'rgba(239,68,68,0.05)'}}><div style={{fontSize:9,color:'#EF4444',fontFamily:M}}>DOWNSIDE</div><div style={{fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:2}}>{A.convexityAnalysis?.maxDownside}</div></div><div style={{flex:1,padding:8,borderRadius:4,background:'rgba(61,214,140,0.05)'}}><div style={{fontSize:9,color:'#3DD68C',fontFamily:M}}>UPSIDE</div><div style={{fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:2}}>{A.convexityAnalysis?.maxUpside}</div></div></div></>,A.convexityAnalysis?.payoffStructure==='convex'?'#3DD68C':'#EF4444')}
              {box(<>{lbl('Fragility: '+(A.convexityAnalysis?.fragilityScore||0)+'/100')}{bar(A.convexityAnalysis?.fragilityScore||0,'#EF4444')}{(A.convexityAnalysis?.fragilityFactors||[]).map((f,i)=><div key={i} style={{fontSize:11,color:'rgba(239,68,68,0.85)',padding:'1px 0',marginTop:4}}>✕ {f}</div>)}{(A.convexityAnalysis?.antifragileElements||[]).map((a,i)=><div key={i} style={{fontSize:11,color:'rgba(61,214,140,0.85)',padding:'1px 0',marginTop:2}}>✦ {a}</div>)}</>,'#EF4444')}
              {A.convexityAnalysis?.barbellOption&&A.convexityAnalysis.barbellOption!=='N/A'&&box(<>{lbl('Barbell Strategy')}<p style={{fontSize:13,color:'rgba(255,255,255,0.95)',lineHeight:1.6}}>{A.convexityAnalysis.barbellOption}</p></>,'#A78BFA')}
            </div>}

            {/* BIASES */}
            {tab===3&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(A.biasDetection||[]).map((b,i)=>box(<><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:b.severity==='high'?'#EF4444':'#EAB308'}}>⚠ {b.bias}</span>{tag(b.severity,b.severity==='high'?'#EF4444':'#EAB308')}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',fontFamily:M,marginBottom:6,padding:'4px 8px',background:'rgba(255,255,255,0.03)',borderRadius:3}}>DETECTED: "{b.detectedSignal}"</div><div style={{fontSize:12,color:'#3DD68C',fontFamily:M}}>REFRAME: {b.reframe}</div></>,b.severity==='high'?'#EF4444':'#EAB308'))}
            </div>}

            {/* SCENARIOS */}
            {tab===4&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(A.scenarios||[]).map((sc,i)=>box(<><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:scenarioColors[i]}}>{sc.name}</span><span style={{fontSize:18,fontWeight:700,fontFamily:M,color:scenarioColors[i]}}>{sc.probability}%</span></div>{bar(typeof sc.probability==='number'?sc.probability:5,scenarioColors[i])}<div style={{fontSize:10,color:'rgba(255,255,255,0.5)',fontFamily:M,margin:'4px 0'}}>BASIS: {sc.probabilityBasis}</div><p style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.5,marginBottom:4}}>{sc.outcome}</p><div style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>📡 {sc.leadingIndicators} · ⏱ {sc.timeline}</div></>,scenarioColors[i]))}
            </div>}

            {/* VERDICT */}
            {tab===5&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
              {A.verdict?.metaQuestion&&box(<>{lbl('Meta: Should You Even Decide Now?')}<p style={{fontSize:13,color:'rgba(255,255,255,0.95)',lineHeight:1.6}}>{A.verdict.metaQuestion}</p></>,'#F59E0B')}
              {box(<><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>{lbl('Recommendation')}<div style={{textAlign:'right'}}><div style={{fontSize:20,fontWeight:700,fontFamily:M,color:(A.verdict?.confidenceLevel||0)>=60?'#3DD68C':'#EAB308'}}>{A.verdict?.confidenceLevel||0}%</div><div style={{fontSize:8,color:'rgba(255,255,255,0.5)',fontFamily:M}}>CONFIDENCE</div></div></div><p style={{fontSize:15,lineHeight:1.7,color:'rgba(255,255,255,0.95)',fontWeight:500}}>{A.verdict?.recommendation}</p></>,'#5B9DF5')}
              {box(<>{lbl('The Question You Haven\'t Asked')}<p style={{fontSize:15,color:'rgba(255,255,255,0.95)',fontFamily:S,fontStyle:'italic',lineHeight:1.5}}>"{A.verdict?.theQuestion}"</p></>,'#EAB308')}
              {box(<>{lbl('Kill Criteria')}{(A.verdict?.killCriteria||[]).map((k,i)=><div key={i} style={{fontSize:12,color:'#EF4444',padding:'3px 0',fontFamily:M}}>✕ {k}</div>)}</>)}
              {box(<>{lbl('Decision Triggers')}{A.verdict?.decisionTriggers&&Object.entries(A.verdict.decisionTriggers).map(([k,v])=><div key={k} style={{fontSize:12,color:k==='abort'?'#EF4444':k==='reconsider'?'#EAB308':'#3DD68C',padding:'3px 0'}}><span style={{fontFamily:M,fontSize:10,opacity:0.7}}>{k.toUpperCase()}: </span>{v}</div>)}</>)}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {box(<><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M,textAlign:'center'}}>SPEED</div><div style={{fontSize:12,fontWeight:600,color:'#5B9DF5',fontFamily:M,textAlign:'center'}}>{A.verdict?.speedAdvisory}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:2,textAlign:'center'}}>{A.verdict?.speedReasoning}</div></>)}
                {box(<><div style={{fontSize:9,color:'rgba(255,255,255,0.5)',fontFamily:M,textAlign:'center'}}>REVIEW</div><div style={{fontSize:12,fontWeight:600,color:'#A78BFA',fontFamily:M,textAlign:'center'}}>{A.verdict?.reviewSchedule}</div></>)}
              </div>
              {box(<>{lbl('What Would Flip This')}<p style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.5}}>{A.verdict?.whatWouldFlip}</p></>,'#EF4444')}
            </div>}
          </div>
        )}

        <div style={{marginTop:48,textAlign:'center',fontSize:9,color:'rgba(255,255,255,0.12)',fontFamily:M,letterSpacing:1}}>PRISM v1.0 · CAPGULL TECHNOLOGIES LLC</div>
      </div>
    </div>
  );
}