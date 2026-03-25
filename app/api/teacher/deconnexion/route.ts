import { logout } from '@/lib/actions/authentication';

export async function GET() {
    await logout();
}