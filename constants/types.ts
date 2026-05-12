export interface Incident {
    id: string;
    userID: string;
    user: string;
    title: string;
    description?: string;
    category: string;
    area: string;
    location: string;
    time: string;
    status: 'Verified' | 'Unverified' | 'False';
    score: number;
    coords: {
      latitude: number;
      longitude: number;
    };
    upvotedBy: string[];
    downvotedBy: string[];
    comments: Comment[];
}
  
export interface Comment {
    user: string;
    userID: string;
    text: string;
    time: string;
    replies?: Comment[];
}
  
export interface User {
    userID: string;
    username: string;
    email?: string;
    reputation: number;
    joined: string;
}

export type SearchResult = 
  | (Incident & { type: 'incident' }) 
  | (User & { type: 'user' });