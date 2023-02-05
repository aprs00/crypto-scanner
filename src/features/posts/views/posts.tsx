import {Link, Outlet} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';

import {homeRoute} from '@/features/home/routes';
import {queryClient} from '@/lib/react-query';
import {fetchPosts} from '@/features/posts/api';
import {postRoute} from './post';

const usePosts = () => {
    return useQuery(['posts'], fetchPosts);
};

const postsRoute = homeRoute.createRoute({
    path: 'posts',
    loader: async () => {
        queryClient.getQueryData(['posts']) ?? (await queryClient.prefetchQuery(['posts'], fetchPosts));
        return {};
    },
    component: () => {
        const postsQuery = usePosts();

        return (
            <div className="p-2 flex gap-2">
                <ul className="list-disc pl-4">
                    {postsQuery.data?.map((post) => {
                        return (
                            <li key={post.id} className="whitespace-nowrap">
                                <Link
                                    to={postRoute.id}
                                    params={{
                                        postId: post.id,
                                    }}
                                    className="block py-1 text-blue-800 hover:text-blue-600"
                                    activeProps={{className: 'text-black font-bold'}}
                                >
                                    <div>{post.title.substring(0, 20)}</div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                <hr />
                <Outlet />
            </div>
        );
    },
    errorComponent: () => 'Oh crap!',
});

export {postsRoute};
