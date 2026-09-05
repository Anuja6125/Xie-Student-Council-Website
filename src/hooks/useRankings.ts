import { useQuery } from '@tanstack/react-query';

interface Winner {
  _id: string;
  event_id: string;
  sub_event_name: string;
  winner_email: string;
  winner_name: string;
  position: string;
  prize: string | null;
  winner_image_url: string | null;
  created_at: string;
  event?: any;
}

interface StudentRanking {
  email: string;
  name: string;
  totalPoints: number;
  eventsParticipated: number;
  eventsWon: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  wins: Winner[];
  imageUrl: string | null;
  rank?: number;
}

const calculatePoints = (position: string): number => {
  const pos = position.toLowerCase();
  if (pos.includes('1st') || pos.includes('first') || pos === '1') return 100;
  if (pos.includes('2nd') || pos.includes('second') || pos === '2') return 75;
  if (pos.includes('3rd') || pos.includes('third') || pos === '3') return 50;
  if (pos.includes('winner')) return 100;
  if (pos.includes('runner')) return 75;
  return 25;
};

// ================= ALL RANKINGS =================
export const useRankings = (category: string = 'overall') => {
  return useQuery({
    queryKey: ['rankings', category],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/rankings");
      if (!res.ok) throw new Error("Failed to fetch rankings");

      const winners: any[] = await res.json();

      const studentMap = new Map<string, StudentRanking>();

      winners.forEach((winner: any) => {
        const email = winner.winner_email;

        if (!studentMap.has(email)) {
          studentMap.set(email, {
            email,
            name: winner.winner_name || email.split('@')[0],
            totalPoints: 0,
            eventsParticipated: 0,
            eventsWon: 0,
            firstPlace: 0,
            secondPlace: 0,
            thirdPlace: 0,
            wins: [],
            imageUrl: winner.winner_image_url || null,
          });
        }

        const student = studentMap.get(email)!;
        const points = calculatePoints(winner.position);

        student.totalPoints += points;
        student.eventsParticipated += 1;
        student.wins.push(winner);

        const pos = winner.position.toLowerCase();

        if (pos.includes('1st') || pos.includes('first') || pos === '1' || pos.includes('winner')) {
          student.eventsWon += 1;
          student.firstPlace += 1;
        } else if (pos.includes('2nd') || pos.includes('second') || pos === '2' || pos.includes('runner')) {
          student.secondPlace += 1;
        } else if (pos.includes('3rd') || pos.includes('third') || pos === '3') {
          student.thirdPlace += 1;
        }
      });

      const rankings = Array.from(studentMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((student, index) => ({
          ...student,
          rank: index + 1,
        }));

      return rankings;
    },
  });
};

// ================= SINGLE STUDENT =================
export const useStudentRanking = (email: string) => {
  return useQuery({
    queryKey: ['student-ranking', email],
    enabled: !!email,
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/winnings/${email}`);
      if (!res.ok) throw new Error("Failed to fetch student ranking");

      const wins: Winner[] = await res.json();

      let totalPoints = 0;
      let firstPlace = 0;
      let secondPlace = 0;
      let thirdPlace = 0;

      wins.forEach(win => {
        totalPoints += calculatePoints(win.position);

        const pos = win.position.toLowerCase();
        if (pos.includes('1st') || pos.includes('first') || pos === '1') firstPlace++;
        else if (pos.includes('2nd') || pos.includes('second') || pos === '2') secondPlace++;
        else if (pos.includes('3rd') || pos.includes('third') || pos === '3') thirdPlace++;
      });

      return {
        email,
        totalPoints,
        eventsParticipated: wins.length,
        firstPlace,
        secondPlace,
        thirdPlace,
        wins,
      };
    },
  });
};

// ================= TOP PERFORMERS =================
export const useTopPerformers = (limit: number = 10) => {
  const { data: allRankings, isLoading } = useRankings();

  return {
    data: allRankings?.slice(0, limit),
    isLoading,
  };
};