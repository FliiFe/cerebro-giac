/* global MathJax */
import icon from './logo.png';
import {memoize} from 'cerebro-tools';
import Giac from './giacggb.js';

const caseval = memoize(Giac.cwrap('caseval', 'string', ['string']));
const lgiac = input => caseval(`latex(${input})`).slice(1,-1);
const mathrender = tex => <div id='math-render'>{'\\[' + tex + '\\]'}</div>;

const monospaceStyle = {fontFamily: ['Source Code Pro', 'monospace']};

const parseEval = command => {
    const limit = command.match(/^\s*limite?\((.+)?\)\s*$/)
        || command.match(/^\s*limite?\((.+)?\)?\s*$/);
    const int = command.match(/^\s*(?:int|integrate|integrer)?\((.+)?\)\s*$/)
        || command.match(/^\s*(?:int|integrate|integrer)?\((.+)?\)?\s*$/);
    if(command.match(/^\s*help\s?\(/) || command.match(/^\?.\w+/)) {
        const result = caseval(command).split('<br>');
        const description = result[0].slice(1).replace(/^.+?<\/b> :/, '');
        const expr = result[1];
        const seealso = result[2];
        const ex = result[3].slice(0,-1).split(';');
        return (<div>
            <b style={monospaceStyle}>{expr}</b>
            <br />
            {description}
            <br />
            <b>See also:</b>
            <span style={monospaceStyle}>{seealso}</span>
            <br />
            <div style={monospaceStyle}>
                { ex.length > 1 && <b>Examples:</b> || '' }
                {ex.map(e => <div>{e}</div>)}
            </div>
        </div>);
    } else if(limit && limit[1]) {
        //TODO: real parser for arguments, not just a split
        const args = limit[1].split(',');
        return (<div id='math-render'>
            {
                // limit symbol
                '\\[\\lim_{' + (args[args.length-2] || 'x') + '\\to ' + args[args.length-1] + '}'
                // expression
                + lgiac(args.slice(0,-2).join(',')) + ' = ' +
                // result
                lgiac(command) + '\\]'
            }
        </div>);
    } else if(false && int && int[1]) {
        const args = int[1];
        //TODO: Implement this
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
    setTimeout(() => window.MathJax && MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'math-render']), 150);
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
