/* global MathJax */
import icon from './logo.png';
import {memoize} from 'cerebro-tools';
import Giac from './giacggb.js';

const caseval = memoize(Giac.cwrap('caseval', 'string', ['string']));
const lgiac = input => {
    const result = caseval(`latex(${input})`).slice(1,-1);
    if (result.includes('_ERROR')) return '\\color{red}{\\texttt{Invalid Input}}';
    else return latexGiacSubstitutions(result);
};
const mathrender = tex => <div id='math-render'>{'\\[' + tex + '\\]'}</div>;

const monospaceStyle = {fontFamily: ['Source Code Pro', 'monospace']};

// TODO: Have a square bracket count going on too
const parseArgs = (input) => input.split('').reduce(({bracketCount, result}, current, index) => {
    if(current === '(') return {bracketCount: bracketCount + 1, result};
    else if(current === ')') return {bracketCount: bracketCount - 1, result};
    else if(current === ',' && bracketCount === 0) return {bracketCount, result: result.concat([index])};
    else return {bracketCount, result};
}, {bracketCount: 0, result: []}).result.concat(input.length).reduce(({lastIndex, value}, val) => ({
    lastIndex: val,
    value: value.concat(input.slice(lastIndex+1, val))
}), {
    lastIndex: -1,
    value: []
}).value;

const help = command => {
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
};

const latexGiacSubstitutions = memoize(input => {
    let result = input;
    result = result.replace(/\\mathrm{factorial}(\\left\([a-zA-Z0-9*+-]+\\right\))/g, (match, m1) => `${m1}!`);
    result = result.replace(/(\\left)?(\[|\\{|\()/g, match => match.indexOf('\\left') === 0 ? match : '\\left' + match);
    result = result.replace(/(\\right)?(\]|\\}|\))/g, match => match.indexOf('\\right') === 0 ? match : '\\right' + match);
    return result;
});

const isFunction = memoize((input, func) => {
    const paren = new RegExp('^\\s*' + func + '\\((.+)?\\)\\s*$');
    const noparen = new RegExp('^\\s*' + func + '\\((.+)?\\)?\\s*$');
    return input.match(paren) || input.match(noparen);
});

const parseEval = command => {
    const limit = isFunction(command, 'limite?');
    const sum = isFunction(command, 'sum?');
    const int = isFunction(command, '(?:int|integrate|integrer)');

    const result = lgiac(command);

    if(command.match(/^\s*help\s?\(/) 
        || command.match(/^\?.\w+/) 
        || result === `\\mathrm{'${command.replace(/\s*/g,'').replace(/_/g,'\\_')}'}`)
        return help(command.match(/\?|help/) ? command : '?' + command);
    else if(limit && limit[1]) {
        let expr, variable, val;
        [expr, variable, val] = parseArgs(limit[1]);
        return mathrender('\\lim_{' + (variable && lgiac(variable) || 'x') + '\\to ' + (val && lgiac(val) || 0) + '}'
                + lgiac(expr) + ' = '
                + lgiac(command));
    } else if(int && int[1]) 
        return mathrender(lgiac(command.replace(/int(?:egrate|egrer)?/g,'Int')) + ' = ' + result);
    else if(sum && sum[1]) {
        let expr, k, i, n;
        [expr, k, i, n] = parseArgs(sum[1]);
        return mathrender('\\sum_{' + (k && lgiac(k) || '') + (i && ' = ' + lgiac(i) || '') + '}^{'
            + (n && lgiac(n) || '') + '} ' + lgiac(expr) + ' = ' + result);
    } else return mathrender(result);
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
