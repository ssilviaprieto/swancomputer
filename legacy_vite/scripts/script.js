console.log('Script loaded!');

const header = document.querySelector('header');
const firstPost = document.querySelector('.blog-post');

if (header && firstPost) {  // Check if elements exist
    const headerHeight = header.offsetHeight;

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || window.pageYOffset;

        if (scrollPosition < 100) {
            header.classList.remove('hidden');
        } else {
            header.classList.add('hidden');
        }
    });
}

// Add this to ensure header is visible at start
window.addEventListener('load', () => {
    if (header) {
        header.classList.remove('hidden');
    }
});

import { createWaterAnimation } from './swanAnimation.js';

document.addEventListener('DOMContentLoaded', () => {
    createWaterAnimation();
});
