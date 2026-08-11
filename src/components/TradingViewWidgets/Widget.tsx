import React, { useEffect, useRef } from 'react';

import { WidgetType, type WidgetProps } from './types';

declare const TradingView: any;

const Widget: React.FC<WidgetProps> = ({ containerId, scriptHTML, scriptSRC, type }) => {
    const ref = useRef<HTMLDivElement>(null);
    const serializedScriptHTML = JSON.stringify(scriptHTML);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        const script = document.createElement('script');
        script.setAttribute('data-nscript', 'afterInteractive');
        script.src = scriptSRC;
        script.async = true;
        script.type = 'text/javascript';

        if (type === WidgetType.Widget || type === WidgetType.MediumWidget) {
            script.onload = () => {
                if (typeof TradingView === 'undefined') return;

                const widgetOptions = JSON.parse(serializedScriptHTML);
                if (type === WidgetType.Widget) new TradingView.widget(widgetOptions);
                else new TradingView.MediumWidget(widgetOptions);
            };
        } else {
            script.textContent = serializedScriptHTML;
        }
        container.appendChild(script);

        return () => {
            script.onload = null;
            container.replaceChildren();
        };
    }, [scriptSRC, serializedScriptHTML, type]);

    return <div id={containerId} ref={ref} />;
};

export default Widget;
