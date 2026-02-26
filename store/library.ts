import { create } from 'zustand';
import { TemplateService } from '@/types/library';
import { getLibraryServices } from '@/actions/libraryActions';

interface LibraryState {
    services: TemplateService[];
    loading: boolean;
    fetchServices: () => Promise<void>;
}

const useLibraryStore = create<LibraryState>((set) => ({
    services: [],
    loading: false,
    fetchServices: async () => {
        set({ loading: true });
        try {
            const services = await getLibraryServices();
            set({ services });
        } catch (error) {
            console.error('[LibraryStore] Error fetching services:', error);
        } finally {
            set({ loading: false });
        }
    },
}));

export default useLibraryStore;
