import React from 'react';
import DynamicSocialFeed from '../components/social/DynamicSocialFeed';
import FacebookEvents from '../components/social/FacebookEvents';
import { socialMetrics } from '../utils/socialMetrics';

const SocialHub: React.FC = () => {
  // Track page view
  React.useEffect(() => {
    socialMetrics.trackEntry({ page: 'social-hub' });
  }, []);

  return (
    <div className="social-hub-page">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Connect With Us</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with our latest posts, events, and exclusive content
          </p>
        </div>

        {/* Facebook Events Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <FacebookEvents 
            layout="grid"
            limit={6}
            showPastEvents={false}
            refreshInterval={1800} // 30 minutes
          />
          
          {/* Compact events widget for sidebar */}
          <aside className="mt-8 p-6 bg-card rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Quick Events</h3>
            <FacebookEvents 
              layout="compact"
              limit={3}
              autoRefresh={false}
            />
          </aside>
        </section>

        {/* Dynamic Social Feed Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Latest from Social Media</h2>
          
          {/* Stories-style recent posts */}
          <div className="mb-8">
            <DynamicSocialFeed 
              layout="stories"
              limit={10}
              enableShoppable={false}
              autoRefresh={true}
              refreshInterval={600} // 10 minutes
            />
          </div>
          
          {/* Main feed grid with shoppable posts */}
          <DynamicSocialFeed 
            platforms={['instagram', 'facebook']}
            layout="grid"
            limit={12}
            enableShoppable={true}
            autoRefresh={true}
            refreshInterval={300} // 5 minutes
            onPostClick={(post) => {
              console.log('Post clicked:', post);
              // Handle post click - could open in modal or redirect
            }}
          />
        </section>

        {/* Hashtag-Filtered Feed */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">#VoicesOfJudah Community</h2>
          <p className="text-muted-foreground mb-6">
            See what our community is sharing with #VoicesOfJudah and #DJLee
          </p>
          <DynamicSocialFeed 
            platforms={['instagram']}
            hashtags={['VoicesOfJudah', 'DJLee']}
            layout="masonry"
            limit={20}
            enableShoppable={false}
          />
        </section>

        {/* Integration Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Stay Connected</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Instagram Feed Card */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Instagram Highlights</h3>
              <DynamicSocialFeed 
                platforms={['instagram']}
                layout="grid"
                limit={4}
                enableShoppable={true}
                autoRefresh={false}
              />
              <a 
                href="https://instagram.com/iam_djlee" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary w-full mt-4"
              >
                Follow on Instagram
              </a>
            </div>

            {/* Facebook Events Card */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-4">Don't Miss Out</h3>
              <FacebookEvents 
                layout="timeline"
                limit={3}
                showPastEvents={false}
                autoRefresh={false}
              />
              <a 
                href="https://facebook.com/voicesofjudah" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary w-full mt-4"
              >
                Follow on Facebook
              </a>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12 bg-accent/10 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8">
            Follow us for exclusive content, live streams, and special announcements
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://instagram.com/iam_djlee" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={() => socialMetrics.trackSocialInteraction('instagram', 'follow_cta', {})}
            >
              Instagram
            </a>
            <a 
              href="https://facebook.com/voicesofjudah" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={() => socialMetrics.trackSocialInteraction('facebook', 'follow_cta', {})}
            >
              Facebook
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SocialHub;