import { logout } from '@/lib/actions/authentication';

export async function POST() {
    await logout();
}