import ky from 'ky';

const api = ky.create({
    retry: 2,
});

export {api};
