

export default function ResetPasswordSessionInvalid() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="h1">Session de réinitialisation invalide</h1>
            <p className="text-lg mb-6">Le lien de réinitialisation que vous avez utilisé est invalide ou a expiré. Veuillez demander une nouvelle réinitialisation de mot de passe.</p>
        </div>
    );
}