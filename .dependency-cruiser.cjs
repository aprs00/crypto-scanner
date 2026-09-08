/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'no-runtime-cycles',
            severity: 'error',
            comment: 'Runtime modules must form an acyclic dependency graph.',
            from: {},
            to: {
                circular: true,
                dependencyTypesNot: ['type-only'],
            },
        },
        {
            name: 'shared-does-not-depend-on-features-or-routes',
            severity: 'error',
            comment: 'Shared application code must remain independent from feature and routing layers.',
            from: {
                path: '^src/(?:components|config|hooks|lib|services|styles|types|utils)/',
            },
            to: {
                path: '^src/(?:features|routes)/',
            },
        },
        {
            name: 'features-do-not-depend-on-routes',
            severity: 'error',
            comment: 'Features are routed by route modules; they must not import route modules.',
            from: {
                path: '^src/features/',
            },
            to: {
                path: '^src/routes/',
            },
        },
        {
            name: 'dashboard-panel-shared-stays-generic',
            severity: 'error',
            comment: 'Shared dashboard panel primitives must not depend on a concrete panel domain.',
            from: {
                path: '^src/features/dashboard/panels/shared/',
            },
            to: {
                path: '^src/features/dashboard/panels/(?!shared/)',
            },
        },
        {
            name: 'dashboard-has-a-single-public-entry-point',
            severity: 'error',
            comment: 'Code outside the dashboard feature must import its public index only.',
            from: {
                path: '^src/(?!features/dashboard/)',
            },
            to: {
                path: '^src/features/dashboard/(?!index[.]ts$)',
            },
        },
        {
            name: 'exchange-internals-stay-private',
            severity: 'error',
            comment: 'Only exchange adapter implementations may import the exchange internal layer.',
            from: {
                path: '^src/(?!services/exchanges/(?:binance|bybit|hyperliquid|internal)/)',
            },
            to: {
                path: '^src/services/exchanges/internal/',
            },
        },
        {
            name: 'no-unresolvable-imports',
            severity: 'error',
            from: {},
            to: {
                couldNotResolve: true,
                pathNot: '^@tanstack/react-start/client$',
            },
        },
    ],
    options: {
        doNotFollow: {
            path: 'node_modules',
        },
        exclude: {
            path: '^src/routeTree[.]gen[.]ts$',
        },
        moduleSystems: ['cjs', 'es6'],
        tsConfig: {
            fileName: 'tsconfig.json',
        },
    },
};
