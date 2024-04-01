import React, {createRef, useEffect} from 'react';

import type {WidgetProps} from './types';

declare const TradingView: any;

const Widget: React.FC<WidgetProps> = ({containerId, scriptHTML, scriptSRC, type}) => {
    const ref: {current: HTMLDivElement | null} = createRef();

    useEffect(() => {
        let refValue: any;

        if (ref.current) {
            const script = document.createElement('script');
            script.setAttribute('data-nscript', 'afterInteractive');
            script.src = scriptSRC;
            script.async = true;
            script.type = 'text/javascript';

            if (type === 'Widget' || type === 'MediumWidget') {
                script.onload = () => {
                    if (typeof TradingView !== undefined) {
                        script.innerHTML = JSON.stringify(
                            type === 'Widget'
                                ? new TradingView.widget(scriptHTML)
                                : type === 'MediumWidget'
                                  ? new TradingView.MediumWidget(scriptHTML)
                                  : undefined,
                        );
                    }
                };
            } else {
                script.innerHTML = JSON.stringify(scriptHTML);
            }
            ref.current.appendChild(script);
            refValue = ref.current;
        }
        return () => {
            if (refValue) {
                while (refValue.firstChild) {
                    refValue.removeChild(refValue.firstChild);
                }
            }
        };
    }, [ref, scriptHTML, type, scriptSRC]);

    return <div id={containerId} ref={ref} />;
};

export default Widget;
