import React from 'react';

export function Panel({ title, children, action }) {
  return <section className="panel"><header className="panel-head"><span>✦ {title}</span>{action && <button className="text-btn" onClick={action}>View All ›</button>}</header><div className="panel-body">{children}</div></section>;
}

export function Stat({ label, value, change }) {
  return <div className="stat"><small>{label}</small><strong>{value}</strong>{change && <em>{change}</em>}</div>;
}

export function Progress({ label, value = 50, color = 'gold' }) {
  return <div className="progress-wrap"><div><span>{label}</span><b>{value}%</b></div><i><span className={color} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></i></div>;
}

export function Button({ children, onClick, kind = '', disabled = false, reason = '', title = '', type = 'button' }) {
  const button = <button type={type} className={`btn ${kind}`} onClick={onClick} disabled={disabled} title={disabled ? (reason || title) : title}>{children}</button>;
  return disabled && reason ? <span className="button-control">{button}<small className="disabled-reason">{reason}</small></span> : button;
}

