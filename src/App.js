import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API = 'http://localhost:8080';

function toArray(text) {
  return text.trim().split(/[\s,]+/).filter(Boolean).map(n => parseInt(n,10)).filter(n => !Number.isNaN(n));
}

function canonical(text) {
  const arr = toArray(text);
  return arr.length ? arr.join(',') : '';
}
function stripIds(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (k === 'id' ? undefined : v)));
}

export default class App extends Component {
  state = {
    input: '',
    resultText: '',
    previous: [],
    error: '',
    mode: 'none',
    lastBuilt: ''
  };

  buildTree = async () => {
    this.setState({ error: '', resultText: '', mode: 'result' });

    const inputNow = this.state.input;
    const canon = canonical(inputNow);
    if (!canon) {
      this.setState({ error: 'Please enter one or more numbers.', mode: 'none' });
      return;
    }
    if (canon === this.state.lastBuilt) {
      this.setState({ error: 'Same input as last build. Please enter new numbers.', mode: 'none' });
      return;
    }

    try {
      const arr = canon.split(',').map(Number);
      const res = await fetch(`${API}/buildTree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(arr),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pretty = JSON.stringify({ Root: stripIds(data) }, null, 2);

      this.setState({ resultText: pretty, mode: 'result', lastBuilt: canon, input: '' });
    } catch (e) {
      this.setState({ error: e.message || 'Request failed', mode: 'none' });
    }
  };

  loadPrevious = async () => {
    this.setState({ error: '', mode: 'previous', resultText: '', input: '' });
    try {
      const res = await fetch(`${API}/getPreviousTrees`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      this.setState({
        previous: rows.sort((a,b)=>(b.id||0)-(a.id||0)),
        mode: 'previous'
      });
    } catch (e) {
      this.setState({ error: e.message || 'Request failed', mode: 'none' });
    }
  };

  render() {
    const { input, resultText, previous, error, mode, lastBuilt } = this.state;
    const preStyle = {
      background: '#f8f9fa', padding: 12, borderRadius: 6,
      whiteSpace: 'pre', fontFamily: 'Menlo, Consolas, monospace',
      fontSize: 14, overflowX: 'auto'
    };
    const inputCanon = canonical(input);
    const isDuplicate = inputCanon && inputCanon === lastBuilt;

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
          {isDuplicate && (
            <div className="form-text text-danger">
              Same as last built. Enter different numbers.
            </div>
          )}
        </div>

        <div className="mb-3 d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={this.buildTree}
            disabled={!inputCanon || isDuplicate}
          >
            Build Tree
          </button>
          <button className="btn btn-outline-secondary" onClick={this.loadPrevious}>
            Show Previous
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {mode === 'result' && (
          <div className="mb-4">
            <h6>Tree Result</h6>
            {resultText
              ? <pre style={preStyle}>{resultText}</pre>
              : <div className="text-muted">Click “Build Tree” to show the JSON here.</div>}
          </div>
        )}

        {mode === 'previous' && (
          <div className="mb-5">
            <h6>Previous Trees</h6>
            {previous.length === 0 ? (
              <div className="text-muted">No previous trees found.</div>
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
        )}
      </div>
    );
  }
}
