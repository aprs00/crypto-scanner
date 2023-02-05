import {homeRoute} from '@/features/home/routes';

const indexRoute = homeRoute.createRoute({
    path: '/',
    component: () => {
        return (
            <div className="p-2">
                <h3>Welcome Home!</h3>
            </div>
        );
    },
});

export {indexRoute};
