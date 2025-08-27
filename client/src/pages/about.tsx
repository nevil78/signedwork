import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Users, Building2, UserCheck, Shield, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import signedworkLogo from "@assets/Signed-Logo_1755167773532.png";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: authUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-slate-800">Signedwork</span>
            </a>
            <nav className="hidden md:flex space-x-8">
              <a href="/about" className="text-slate-900 font-medium">
                About
              </a>
              <a href="/support" className="text-slate-600 hover:text-slate-900 transition-colors">
                Support
              </a>
              <a href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
            </nav>
            <div className="md:hidden">
              {/* Mobile navigation - clean header */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-6" data-testid="heading-about">
            About Signedwork
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed" data-testid="text-intro">
            Signedwork is a revolutionary employee work verification platform that brings transparency and authenticity to professional careers. We enable employees to build verified work portfolios while helping companies and recruiters make confident hiring decisions based on proven track records.
          </p>
        </div>

        {/* What is Signedwork */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12" data-testid="section-what-is">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-slate-900">What is Signedwork?</h2>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed mb-4">
            Signedwork is where professional work meets verifiable proof. Our platform allows employees to log their project work in detailed work diaries, which are then verified by their companies. Every verified entry receives an official verification badge, creating an authentic and trustworthy professional portfolio.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            Think of it as LinkedIn with verified proof of work – where every accomplishment is backed by company validation, making professional profiles more credible and valuable than ever before.
          </p>
        </div>

        {/* Three Key Sections */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* For Employees */}
          <div className="bg-white rounded-xl shadow-lg p-8" data-testid="section-employees">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">For Employees</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Build a trusted professional profile backed by verified projects and work diaries</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Strengthen your CV with company-verified work entries and achievements</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Stand out to recruiters with authentic, verifiable work history</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Track and showcase your professional growth over time</span>
              </li>
            </ul>
          </div>

          {/* For Companies */}
          <div className="bg-white rounded-xl shadow-lg p-8" data-testid="section-companies">
            <div className="flex items-center mb-6">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">For Companies</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Verify and approve employee work entries with detailed feedback and ratings</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Post job openings and recruit from a pool of verified talent</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Track employee performance and contributions systematically</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Build a reputation as a company that values and verifies great work</span>
              </li>
            </ul>
          </div>

          {/* For Recruiters */}
          <div className="bg-white rounded-xl shadow-lg p-8" data-testid="section-recruiters">
            <div className="flex items-center mb-6">
              <UserCheck className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">For Recruiters & HR</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Hire with confidence knowing candidates have verified work histories</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Reduce hiring risks by accessing company-verified performance data</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Streamline recruitment with detailed, authentic candidate profiles</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Make better hiring decisions based on proven track records</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Verification Process */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12" data-testid="section-process">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">How Verification Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">1. Employee Logs Work</h4>
              <p className="text-slate-600">Employees document their projects, tasks, and achievements in detailed work diary entries</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">2. Company Reviews</h4>
              <p className="text-slate-600">Companies review, provide feedback, and verify the authenticity of each work entry</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">3. Verification Badge</h4>
              <p className="text-slate-600">Approved entries receive official verification badges, creating trusted professional profiles</p>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center" data-testid="section-mission">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Mission</h3>
          <p className="text-lg text-slate-700 leading-relaxed mb-6 max-w-3xl mx-auto">
            Signedwork's mission is to bring transparency, authenticity, and trust to professional careers and recruitment processes. We believe that every professional deserves recognition for their verified contributions, and every employer deserves confidence in their hiring decisions.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed mb-8 max-w-3xl mx-auto">
            By creating a platform where work is not just claimed but proven, we're building a future where professional success is measured by verified achievements, making the job market more fair, transparent, and trustworthy for everyone.
          </p>
          
          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setLocation(authUser ? "/dashboard" : "/")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center"
              data-testid="button-get-started"
            >
              {authUser ? "Go to Dashboard" : "Get Started Today"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={signedworkLogo} alt="Signedwork" className="h-6 w-6 mr-2" />
              <span className="text-slate-600">© 2025 Signedwork. Building trust through verification.</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="/about" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="link-about">
                About
              </Link>
              <Link href="/support" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="link-support">
                Support
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="link-contact">
                Contact
              </Link>
              <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="link-terms">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}