import { useState, useEffect } from 'react';
import type { Holiday } from '../utils/types';

const STORAGE_KEY = '@calculadora-prazos/holidays';

export function useHolidays() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setHolidays(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse holidays', e);
            }
        }
    }, []);

    const saveHolidays = (newHolidays: Holiday[]) => {
        setHolidays(newHolidays);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHolidays));
    };

    const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
        const newHoliday: Holiday = {
            ...holiday,
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        };
        saveHolidays([...holidays, newHoliday]);
    };

    const removeHoliday = (id: string) => {
        saveHolidays(holidays.filter(h => h.id !== id));
    };

    return { holidays, addHoliday, removeHoliday };
}
