import { Select as Course } from '@/lib/db/schema/course';
import { formatInTimeZone } from 'date-fns-tz';

const PARIS_TIME_ZONE = 'Europe/Paris';

interface CoursProps {
    cours: Course;
}

export default function Cours({ cours }: Readonly<CoursProps>) {
    return (
        <div>
            <h1>Cours : {cours.subject}</h1>
            <p>commence le {formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'dd/MM/yyyy HH:mm')}</p>
            <p>se termine le {formatInTimeZone(cours.endAt, PARIS_TIME_ZONE, 'dd/MM/yyyy HH:mm')}</p>
            <br></br>
        </div>
    );
}
