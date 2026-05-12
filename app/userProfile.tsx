import { useLocalSearchParams } from "expo-router";
import ProfileView from "../components/profileView";

//display user profile (other than authenticated user)
export default function UserProfileStack() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <ProfileView passedId={id} />;
}