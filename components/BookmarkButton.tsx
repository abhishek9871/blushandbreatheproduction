import React from 'react';
import { useBookmarks, BookmarkableItem } from '../hooks/useBookmarks';

interface BookmarkButtonProps {
    item: BookmarkableItem;
    className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ item, className }) => {
    const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
    
    if (!item || !item.id) return null;

    const bookmarked = isBookmarked(item.id);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (bookmarked) {
            removeBookmark(item.id);
        } else {
            addBookmark(item);
        }
    };

    return (
        <button
            onClick={handleToggle}
            aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            aria-pressed={bookmarked}
            title={bookmarked ? 'Bookmarked' : 'Add to bookmarks'}
            className={`p-2 rounded-full transition-colors ${bookmarked ? '!text-primary !bg-primary/10' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-primary dark:hover:text-primary'} ${className || ''}`}
        >
            <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}
            >
                bookmark
            </span>
        </button>
    );
};

export default BookmarkButton;
