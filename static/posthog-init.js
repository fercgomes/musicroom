(function () {
    const config = window.POSTHOG_CONFIG;

    if (!config) {
        return;
    }

    const script = document.createElement('script');
    script.async = false;
    script.src = `${config.host}/static/array.js`;
    script.onload = function () {
        window.posthog.init(config.key, {
            api_host: config.host,
            defaults: '2026-08-30',
            logs: {
                serviceName: 'musicroom-web'
            },
            capture_exceptions: {
                capture_unhandled_errors: true,
                capture_unhandled_rejections: true,
                capture_console_errors: false
            }
        });
    };
    document.head.appendChild(script);
})();
