import { Route, Switch } from 'wouter';
import { AppShell } from '@/components/AppShell';
import { GalleryPage } from '@/routes/GalleryPage';
import { PostDetailPage } from '@/routes/PostDetailPage';
import { CategoryPage } from '@/routes/CategoryPage';
import { TagPage } from '@/routes/TagPage';

function App() {
    return (
        <AppShell>
            <Switch>
                <Route path="/" component={GalleryPage} />
                <Route path="/category/:id" component={CategoryPage} />
                <Route path="/tag/:id" component={TagPage} />
                <Route path="/post/:id" component={PostDetailPage} />
                <Route>
                    <div className="py-12 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            Page not found
                        </h2>
                        <p className="text-slate-500">
                            The page you're looking for doesn't exist.
                        </p>
                    </div>
                </Route>
            </Switch>
        </AppShell>
    );
}

export default App;
