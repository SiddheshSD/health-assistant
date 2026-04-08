"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mounts inside the dashboard. Checks localStorage for profile completion.
 * If the user hasn't finished the health profile wizard, redirects them to /register/profile.
 */
export function ProfileGuard() {
    const router = useRouter();

    useEffect(() => {
        const isComplete = localStorage.getItem("healthai_profile_complete");
        if (!isComplete) {
            router.replace("/register/profile");
        }
    }, [router]);

    return null; // renders nothing — purely a redirect guard
}
