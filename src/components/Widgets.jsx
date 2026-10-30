import React from 'react';
export function Panel({title,children,action}){return <section className="panel"><header className="panel-head"><span>✦ {title}</span>{action&&<button className="text-btn" onClick={action}>View All ›</button>}</header><div className="panel-body">{children}</div></section>}
export function Stat({label,value,change}){return <div className="stat"><small>{label}</small><strong>{value}</strong>{change&&<em>{change}</em>}</div>}
export function Progress({label,value=50,color='gold'}){return <div className="progress-wrap"><div><span>{label}</span><b>{value}%</b></div><i><span className={color} style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></i></div>}
export function Button({children,onClick,kind=''}){return <button className={`btn ${kind}`} onClick={onClick}>{children}</button>}
export function Modal({title,children,onClose}){return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><header>{title}<button onClick={onClose}>✕</button></header>{children}</div></div>}
