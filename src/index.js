/* global MathJax */
import icon from './logo.png';
import {memoize} from 'cerebro-tools';
import Giac from './giacggb.js';

const caseval = memoize(Giac.cwrap('caseval', 'string', ['string']));
const lgiac = input => caseval(`latex(${input})`).slice(1,-1);
const mathrender = tex => <div id='math-render'>{'\\[' + tex + '\\]'}</div>;

const parseEval = command => {
    if(command.match(/^[ \t]*help[ \t]?\(/) || command.match(/^\?\w+/)) {
        const result = caseval(command).split('<br>');
        const description = result[0].slice(1).replace(/^.+?<\/b> :/, '');
        const expr = result[1];
        const seealso = result[2];
        const ex = result[3].split(';');
        return (<div>
            <b style={{fontFamily: ['Source Code Pro', 'monospace']}}>{expr}</b>
            <br />
            {description}
            <br />
            <b>See also:</b>
            <span style={{fontFamily: ['Source Code Pro', 'monospace']}}>{seealso}</span>
            <br />
            <b>Examples:</b>
            <div style={{fontFamily: ['Source Code Pro', 'monospace']}}>
                {ex.map(e => <div>{e}</div>)}
            </div>
        </div>);
    } else {
        return mathrender(lgiac(command));
    }
};


export const fn = async ({ term, display }) => {
    if(term.indexOf('giac ') !== 0) return;
    if(!window.MathJax) await loadMathJax();

    const command = term.substring(5);
    const outcome = parseEval(command);

    display({
        icon,
        title: 'Giac CAS',
        getPreview: () => outcome
    });
    setTimeout(() => window.MathJax && MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'math-render']), 200);
};

export const keyword = 'giac';

const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
});

const loadMathJax = () => {
    window.MathJax = {
        SVG: {scale: 150}
    };
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-AMS_SVG');
};
