import {useParams} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';

import {queryClient} from '@/lib/react-query';
import {postsRoute} from './posts';
import {fetchPostById} from '../api';

function usePost(postId: string) {
    return useQuery(['posts', postId], () => fetchPostById(postId), {
        enabled: !!postId,
    });
}

export const postRoute = postsRoute.createRoute({
    path: '$postId',
    loader: async ({params: {postId}}) => {
        queryClient.getQueryData(['posts', postId]) ?? (await queryClient.prefetchQuery(['posts', postId], () => fetchPostById(postId)));
        return {};
    },
    component: () => {
        const {postId} = useParams({from: postRoute.id});
        const postQuery = usePost(postId);

        return (
            <div className="space-y-2">
                <h4 className="text-xl font-bold underline">{postQuery.data?.title}</h4>
                <div className="text-sm">{postQuery.data?.body}</div>
            </div>
        );
    },
});
