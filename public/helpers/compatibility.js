navigator.isCompatible = (() => {
    const getBrowser = () => {
        let userAgent = navigator.userAgent, 
            tem,
            M = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
            return 'IE '+(tem[1] || '');
        };
        if (M[1]=== 'Chrome') {
            tem = userAgent.match(/\b(OPR|Edge?)\/(\d+)/);
            if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera').replace('Edg ', 'Edge ');            
        };
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = userAgent.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    };
    const browser = getBrowser();
    return ( browser.includes("Chrome") || browser.includes("Opera") );
})();