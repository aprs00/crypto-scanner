import ky from 'ky';

import {PostType} from '../types';

export async function fetchPosts() {
    console.log('Fetching posts...');
    await new Promise((r) => setTimeout(r, 500));
    return ky.get('https://jsonplaceholder.typicode.com/posts').then((r) => r.data.slice(0, 10));
}

export async function fetchPostById(postId: string) {
    console.log(`Fetching post with id ${postId}...`);
    await new Promise((r) => setTimeout(r, 500));

    return await ky.get(`https://jsonplaceholder.typicode.com/posts/${postId}`).then((r) => r.data);
}
