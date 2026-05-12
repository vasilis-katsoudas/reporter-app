import { useRouter } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useProfileNavigation() {
    const router = useRouter();
    const { user } = useContext(AuthContext);

    //handle user profile navigation
    const navigateToProfile = (profileUserId: string) => {
        if (!profileUserId) return;

        if (profileUserId === user?.userID) {
        router.push("/profile"); 
        } else {
        router.push({
            pathname: "/userProfile",
            params: { id: profileUserId }
        });
        }
    };

    return navigateToProfile;
}