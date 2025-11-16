
import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';

interface BookmarkButtonProps {
    itemId: string;
    className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ itemId, className }) => {
    const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
    const bookmarked = isBookmarked(itemId);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (bookmarked) {
            removeBookmark(itemId);
        } else {
            addBookmark(itemId);
        }
    };

    return (
        <button
            onClick={handleToggle}
            aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            className={`p-2 rounded-full transition-colors ${className}`}
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
