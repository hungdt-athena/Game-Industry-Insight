// Global event emitter for saved posts update
type SavedPostsListener = () => void;
type PostUpdateListener = (postId: string, action: 'save' | 'unsave' | 'like' | 'unlike') => void;

const savedListeners: Set<SavedPostsListener> = new Set();
const postUpdateListeners: Set<PostUpdateListener> = new Set();

export const savedPostsEvents = {
    subscribe: (listener: SavedPostsListener) => {
        savedListeners.add(listener);
        return () => savedListeners.delete(listener);
    },
    emit: () => {
        savedListeners.forEach(listener => listener());
    }
};

// Event system for post updates (likes, saves)
export const postUpdateEvents = {
    subscribe: (listener: PostUpdateListener) => {
        postUpdateListeners.add(listener);
        return () => postUpdateListeners.delete(listener);
    },
    emit: (postId: string, action: 'save' | 'unsave' | 'like' | 'unlike') => {
        postUpdateListeners.forEach(listener => listener(postId, action));
    }
};
