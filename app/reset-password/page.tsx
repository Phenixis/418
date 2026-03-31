import ResetPasswordSessionInvalid from "@/components/general/ResetPassword/ResetPasswordSessionInvalid";
import ResetPasswordForm from "@/components/general/ResetPassword/ResetPasswordServer";
import CreateResetPasswordSession from "@/components/general/ResetPassword/CreateResetPasswordSession";


export default async function ResetPasswordPage({
    searchParams
}: Readonly<{ searchParams: Promise<{ session_id: string, new: boolean, target: string }> }>) {
    const { session_id, new: isNew, target } = await searchParams;

    if (isNew && (target === "teacher" || target === "student")) {
        return <CreateResetPasswordSession target={target} />
    }


    if (!session_id) {
        console.log("Session ID is missing in query parameters:", session_id);
        return <ResetPasswordSessionInvalid />
    }

    return <ResetPasswordForm sessionId={session_id} />;
}