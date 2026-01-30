import { Route, Switch, Redirect } from 'wouter';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GalleryPage } from '@/routes/GalleryPage';
import { PostDetailPage } from '@/routes/PostDetailPage';
import { CategoryPage } from '@/routes/CategoryPage';
import { TagPage } from '@/routes/TagPage';
import { LoginPage } from '@/routes/LoginPage';
import { ProfilePage } from '@/components/ProfilePage';
import { AuthorProfilePage } from '@/components/AuthorProfilePage';

function App() {
    return (
        <Switch>
            {/* Auth pages - outside AppShell */}
            <Route path="/login" component={LoginPage} />
            {/* Redirect register to login - public registration disabled, use admin invite */}
            <Route path="/register">
                <Redirect to="/login" />
            </Route>

            {/* Main app with shell - protected */}
            <Route>
                <ProtectedRoute>
                    <AppShell>
                        <Switch>
                            <Route path="/" component={GalleryPage} />
                            <Route path="/category/:id" component={CategoryPage} />
                            <Route path="/tag/:id" component={TagPage} />
                            <Route path="/post/:id" component={PostDetailPage} />
                            <Route path="/author/:id" component={AuthorProfilePage} />
                            <Route path="/profile" component={ProfilePage} />
                            <Route path="/profile/:userId" component={ProfilePage} />
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
                </ProtectedRoute>
            </Route>
        </Switch>
    );
}

export default App;
