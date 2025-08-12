// src/App.js
import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API = 'http://localhost:8080';

function toArray(text) {
  return text.trim().split(/[\s,]+/).filter(Boolean).map(n => parseInt(n,10)).filter(n => !Number.isNaN(n));
}
function stripIds(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (k === 'id' ? undefined : v)));
}

export default class App extends Component {
  state = {
    input: '',            // <-- empty by default
    resultText: '',
    previous: [],
    error: ''
  };

  buildTree = async () => {
    this.setState({ error: '', resultText: '' });
    const arr = toArray(this.state.input);
    if (arr.length === 0) {
      this.setState({ error: 'Please enter one or more numbers.' });
      return;
    }
    try {
      const res = await fetch(`${API}/buildTree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arr),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pretty = JSON.stringify({ Root: stripIds(data) }, null, 2);
      this.setState({ resultText: pretty });
    } catch (e) {
      this.setState({ error: e.message || 'Request failed' });
    }
  };

  loadPrevious = async () => {
    this.setState({ error: '' });
    try {
      const res = await fetch(`${API}/getPreviousTrees`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      this.setState({ previous: rows.sort((a,b)=>(b.id||0)-(a.id||0)) });
    } catch (e) {
      this.setState({ error: e.message || 'Request failed' });
    }
  };

  render() {
    const { input, resultText, previous, error } = this.state;
    const preStyle = {
      background: '#f8f9fa', padding: 12, borderRadius: 6,
      whiteSpace: 'pre', fontFamily: 'Menlo, Consolas, monospace',
      fontSize: 14, overflowX: 'auto'
    };

    return (
      <div className="container py-4">
        <h4 className="mb-3">Binary Search Tree (JSON view)</h4>

        <div className="mb-3">
          <label className="form-label">Numbers (comma or space separated)</label>
          <input
            className="form-control"
            value={input}
            onChange={(e) => this.setState({ input: e.target.value })}
          />
        </div>

        <div className="mb-3 d-flex gap-2">
          <button className="btn btn-primary" onClick={this.buildTree}>Build Tree</button>
          <button className="btn btn-outline-secondary" onClick={this.loadPrevious}>Show Previous</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-4">
          <h6>Tree Result</h6>
          {resultText ? <pre style={preStyle}>{resultText}</pre>
                      : <div className="text-muted">Click “Build Tree” to show the JSON here.</div>}
        </div>

        <div className="mb-5">
          <h6>Previous Trees</h6>
          {previous.length === 0 ? (
            <div className="text-muted">No previous trees loaded. Click “Show Previous”.</div>
          ) : (
            previous.map((item) => {
              let pretty = item.treeJson;
              try {
                pretty = JSON.stringify({ Root: stripIds(JSON.parse(item.treeJson)) }, null, 2);
              } catch {}
              return (
                <div key={item.id} className="mb-3">
                  <div className="small text-muted mb-1">Inputs: {item.userInputs}</div>
                  <pre style={preStyle}>{pretty}</pre>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
}
