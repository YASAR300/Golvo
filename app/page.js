"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Search,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  Skeleton,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  Spinner,
} from "@/components/ui";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestToast = () => {
    toast.success("Welcome to Golvo — Design system initialized!");
  };

  const handleSimulateAction = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Entry ticket claimed successfully!");
    }, 1200);
  };

  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* Header & Hero */}
      <header className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2">
          <Badge variant="accent" size="sm" withDot>
            Golvo Platform v0.1
          </Badge>
          <span className="font-caveat text-base text-[#8A95FF] -rotate-2">
            handcrafted dark theme ✨
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gradient">
          Golf Performance & Charity Prize Draws
        </h1>

        <p className="text-base sm:text-lg text-secondary leading-relaxed">
          Elevate your handicap with precision analytics while participating in verified, high-impact charity prize draws every month.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleTestToast}
          >
            Explore Dashboard
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            Open Draw Modal
          </Button>
        </div>
      </header>

      {/* Tabs Showcase */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-primary">UI Component System</h2>
            <p className="text-xs text-secondary mt-0.5">
              Production-ready, accessible primitives built for Golvo.
            </p>
          </div>
          <span className="font-caveat text-sm text-[#F2C94C] rotate-1">
            linear-inspired precision
          </span>
        </div>

        <Tabs defaultValue="buttons">
          <TabList>
            <TabTrigger value="buttons">Buttons & Badges</TabTrigger>
            <TabTrigger value="forms">Form Controls</TabTrigger>
            <TabTrigger value="cards">Cards & Skeletons</TabTrigger>
            <TabTrigger value="data">Table & Empty State</TabTrigger>
          </TabList>

          {/* TAB 1: Buttons & Badges */}
          <TabContent value="buttons" className="space-y-8 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants & States</CardTitle>
                <CardDescription>
                  Supports primary, secondary, ghost, danger, multiple sizes, and reactive loading state.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="md">
                    Primary Action
                  </Button>
                  <Button variant="secondary" size="md">
                    Secondary Action
                  </Button>
                  <Button variant="ghost" size="md">
                    Ghost Action
                  </Button>
                  <Button variant="danger" size="md">
                    Danger Action
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    onClick={handleSimulateAction}
                  >
                    {isLoading ? "Submitting..." : "Click to Test Loader"}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button variant="primary" size="sm">
                    Small
                  </Button>
                  <Button variant="primary" size="md">
                    Medium
                  </Button>
                  <Button variant="primary" size="lg">
                    Large Button
                  </Button>
                  <div className="inline-flex items-center gap-2 pl-4 text-xs text-secondary">
                    <Spinner size="sm" />
                    <span>Inline Spinner</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>
                  Subtle pill badges for membership statuses, draw tiers, and verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="accent" withDot>
                    Pro Subscriber
                  </Badge>
                  <Badge variant="success" withDot>
                    Draw Active
                  </Badge>
                  <Badge variant="warning" withDot>
                    Entries Closing Soon
                  </Badge>
                  <Badge variant="danger" withDot>
                    Membership Expired
                  </Badge>
                  <Badge variant="neutral">Handicap: 4.2</Badge>
                </div>
              </CardContent>
            </Card>
          </TabContent>

          {/* TAB 2: Forms */}
          <TabContent value="forms" className="space-y-6 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Accessible Form Inputs</CardTitle>
                <CardDescription>
                  Standardized text input, dropdown select, label, and textarea.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 max-w-xl">
                <Input
                  label="Golfer Full Name"
                  placeholder="e.g. Rory McIlroy"
                  required
                />

                <Input
                  label="Search Tournament / Club"
                  leftIcon={<Search className="w-4 h-4" />}
                  placeholder="Type club name or location..."
                  helperText="Search across 4,200+ partner golf courses"
                />

                <Select
                  label="Monthly Charity Draw Tier"
                  placeholder="Select subscription draw tier"
                  options={[
                    { value: "birdie", label: "Birdie Tier ($19/mo) — 5 Draw Entries" },
                    { value: "eagle", label: "Eagle Tier ($39/mo) — 15 Draw Entries" },
                    { value: "albatross", label: "Albatross VIP ($79/mo) — 40 Draw Entries" },
                  ]}
                />

                <Textarea
                  label="Round Notes & Handicap Reflections"
                  placeholder="Record key drives, wind conditions, and putting confidence..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </TabContent>

          {/* TAB 3: Cards & Skeletons */}
          <TabContent value="cards" className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Trophy className="w-5 h-5 text-accent" />
                    <Badge variant="accent" size="sm">Monthly</Badge>
                  </div>
                  <CardTitle className="pt-2">Pebble Beach VIP Trip</CardTitle>
                  <CardDescription>3-Night all-inclusive stay + round with PGA coach.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">$12,500 Valued</div>
                  <p className="text-xs text-secondary mt-1">428 entries currently recorded</p>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" size="sm" className="w-full">
                    View Charity Details
                  </Button>
                </CardFooter>
              </Card>

              <Card hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-5 h-5 text-[#4CC38A]" />
                    <Badge variant="success" size="sm">Trending</Badge>
                  </div>
                  <CardTitle className="pt-2">Handicap Velocity</CardTitle>
                  <CardDescription>Last 10 certified rounds analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#4CC38A]">-1.8 Differential</div>
                  <p className="text-xs text-secondary mt-1">Top 8% progression this quarter</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Performance Tab
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="w-16 h-5" />
                  </div>
                  <Skeleton className="w-3/4 h-5 mt-2" />
                  <Skeleton className="w-full h-3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="w-1/2 h-8" />
                  <Skeleton className="w-2/3 h-3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="w-full h-9 rounded-[8px]" />
                </CardFooter>
              </Card>
            </div>
          </TabContent>

          {/* TAB 4: Table & Empty State */}
          <TabContent value="data" className="space-y-6 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Verified Rounds</CardTitle>
                <CardDescription>Sync status with USGA and verified partner clubs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Differential</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Augusta National (Guest)</TableCell>
                      <TableCell>Sep 18, 2026</TableCell>
                      <TableCell>76</TableCell>
                      <TableCell>+3.4</TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm">Verified</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">St Andrews Old Course</TableCell>
                      <TableCell>Sep 04, 2026</TableCell>
                      <TableCell>72</TableCell>
                      <TableCell>-0.2</TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm">Verified</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TPC Sawgrass</TableCell>
                      <TableCell>Aug 21, 2026</TableCell>
                      <TableCell>81</TableCell>
                      <TableCell>+6.8</TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm">Pending Review</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <EmptyState
              icon={<Award className="w-6 h-6 text-accent" />}
              title="No Pending Charity Claims"
              description="When you win a monthly charity draw or unlock milestone golf gear, your claim vouchers will appear right here."
              actionText="Browse Current Draws"
              onAction={() => setIsModalOpen(true)}
            />
          </TabContent>
        </Tabs>
      </section>

      {/* Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pebble Beach Charity Draw Entry"
        description="Proceed with your subscription tickets or purchase single entries."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-[8px] bg-[#141516] border border-white/10 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4CC38A] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-primary">Your Pro Plan includes 15 automatic entries</p>
              <p className="text-secondary">
                100% of non-prize proceeds are donated directly to the First Tee Youth Golf Foundation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                toast.success("Entry confirmed for upcoming draw!");
              }}
            >
              Confirm Entries
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
