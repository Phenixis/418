import { Select as Course } from '@/lib/db/schema/course';
import { format } from 'date-fns';

interface CoursProps {
    cours: Course;
}

export default function Cours({ cours }: CoursProps) {
    return (
        <div>
            <h1>Cours : {cours.subject}</h1>
            <p>commence le {format(cours.startAt, 'dd/MM/yyyy HH:mm')}</p>
            <p>se termine le {format(cours.endAt, 'dd/MM/yyyy HH:mm')}</p>
            <br></br>
        </div>
    );
}
