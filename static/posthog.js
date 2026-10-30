(function () {
    var config = window.__POSTHOG_CONFIG__;
    var missingVariable = !config || !config.projectToken
        ? 'POSTHOG_PROJECT_TOKEN'
        : !config.host
            ? 'POSTHOG_HOST'
            : null;

    if (missingVariable) {
        if (config && config.isDevelopment) {
            throw new Error(
                missingVariable + ' variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ' + missingVariable + ' is configured'
            );
        }
        return;
    }

    var posthog = window.posthog = window.posthog || [];
    if (posthog.__SV) {
        return;
    }

    posthog._i = [];
    posthog.init = function (projectToken, options) {
        function addMethod(target, method) {
            target[method] = function () {
                target.push([method].concat(Array.prototype.slice.call(arguments)));
            };
        }

        addMethod(posthog, 'capture');
        posthog.logger = posthog.logger || [];
        addMethod(posthog.logger, 'info');

        var posthogScript = document.createElement('script');
        posthogScript.async = true;
        posthogScript.src = options.api_host + '/static/array.js';
        document.head.appendChild(posthogScript);
        posthog._i.push([projectToken, options]);
    };
    posthog.__SV = 1;

    posthog.init(config.projectToken, {
        api_host: config.host,
        defaults: '2026-08-30',
        capture_exceptions: {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: false
        },
        logs: {
            serviceName: 'musicroom-web',
            environment: config.isDevelopment ? 'development' : 'production'
        }
    });
})();
