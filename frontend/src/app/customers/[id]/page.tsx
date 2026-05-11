'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCustomerDetail, getCustomerVisits, CustomerDetailResponse, VisitDetail } from '@/lib/api';
import ActivityList from '@/components/ActivityList';
import StatCard from '@/components/StatCard';
import { Utensils, DollarSign, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

const PAGE_SIZE = 20;

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  useEffect(() => {
    if (id) {
      Promise.all([
        getCustomerDetail(Number(id)),
        getCustomerVisits(Number(id), { skip: 0, limit: PAGE_SIZE })
      ]).then(([custData, visitsData]) => {
        setCustomer(custData);
        setVisits(visitsData);
        setHasMore(visitsData.length === PAGE_SIZE);
        setLoading(false);
      });
    }
  }, [id]);

  const loadMore = async () => {
    if (!id || loadingMore) return;
    setLoadingMore(true);
    const newSkip = skip + PAGE_SIZE;
    try {
      const data = await getCustomerVisits(Number(id), { skip: newSkip, limit: PAGE_SIZE });
      setVisits(prev => [...prev, ...data]);
      setSkip(newSkip);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading || !customer) return <div className="animate-pulse h-40 bg-stone-100 rounded-xl"></div>;

  const formattedVisits = visits.map(v => ({
    id: String(v.id),
    phoneNumber: customer.phone_number,
    name: customer.name,
    amount: v.amount,
    visitedAt: v.visited_at
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">{customer.name || customer.phone_number}</h1>
        <p className="text-stone-500">{customer.phone_number}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Visits" value={customer.total_visits} icon={<Utensils className="h-4 w-4" />} />
        <StatCard label="Total Spent" value={`$${customer.total_spent || 0}`} icon={<DollarSign className="h-4 w-4" />} accent="green" />
      </section>

      <section>
        <h2 className="text-lg font-bold text-stone-900 mb-3">Visit History</h2>
        {formattedVisits.length > 0 ? (
          <div className="space-y-4">
            <ActivityList visits={formattedVisits} />
            {hasMore && (
              <Button
                variant="secondary"
                fullWidth
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-500 bg-stone-50 p-4 rounded-xl">No visits recorded.</p>
        )}
      </section>
    </div>
  );
}
