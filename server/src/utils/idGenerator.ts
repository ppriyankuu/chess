import { v4 as uuid } from 'uuid';

export const generateGameId = (): string => {
    return uuid().split('-')[0].toUpperCase();
}

export const generatePlayerId = (): string => {
    return uuid().split('-')[0].toLowerCase();
}
