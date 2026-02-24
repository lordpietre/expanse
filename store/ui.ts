import { create } from 'zustand';

interface UIState {
    isLibraryOpen: boolean;
    libraryCategory?: string;
    setIsLibraryOpen: (isOpen: boolean, category?: string) => void;
}

const useUIStore = create<UIState>((set) => ({
    isLibraryOpen: false,
    libraryCategory: undefined,
    setIsLibraryOpen: (isOpen, category) => set({ isLibraryOpen: isOpen, libraryCategory: category }),
}));

export default useUIStore;
