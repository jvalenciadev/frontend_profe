import LandingPage from '../page';

export default function TenantPage({ params }: { params: { tenant: string } }) {
    return <LandingPage params={params} />;
}
