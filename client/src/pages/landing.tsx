import { useState } from "react";
import { Building, Users, Briefcase, Shield, Check, Star, ArrowRight, PlayCircle, ChevronRight, Globe, Award, Zap, Target, BarChart3, Network, UserCheck, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import UnifiedHeader from "@/components/UnifiedHeader";

export default function LandingPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const professionalFeatures = [
    { icon: <UserCheck className="w-6 h-6" />, title: "Professional Profiles", desc: "Comprehensive verified profiles with immutable work credentials" },
    { icon: <Briefcase className="w-6 h-6" />, title: "Job Discovery", desc: "AI-powered job matching with career growth tracking" },
    { icon: <Award className="w-6 h-6" />, title: "Verified Experience", desc: "Immutable work verification with company endorsements" },
    { icon: <Network className="w-6 h-6" />, title: "Professional Network", desc: "Connect with verified professionals and industry experts" }
  ];

  const enterpriseFeatures = [
    { icon: <Building className="w-6 h-6" />, title: "Hierarchical Structure", desc: "Company → Branches → Teams with role-based permissions" },
    { icon: <Clock className="w-6 h-6" />, title: "Work Diary Management", desc: "Advanced work tracking with multi-level verification" },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Performance Analytics", desc: "Real-time insights and organizational health monitoring" },
    { icon: <Shield className="w-6 h-6" />, title: "Enterprise Security", desc: "Role-based access control with audit trails" }
  ];

  const recruiterFeatures = [
    { icon: <Users className="w-6 h-6" />, title: "Talent Discovery", desc: "Access verified professionals with immutable work history" },
    { icon: <Network className="w-6 h-6" />, title: "Company Network", desc: "Connect with hiring companies across all industries" },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Recruitment Analytics", desc: "Data-driven insights for better talent matching" },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: "Verified Credentials", desc: "Trust in candidate profiles with company endorsements" }
  ];

  const stats = [
    { number: "10K+", label: "Active Professionals" },
    { number: "500+", label: "Companies" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "HR Director",
      company: "TechCorp Solutions",
      avatar: "SC",
      text: "Signedwork transformed how we manage our global workforce. The hierarchical structure perfectly matches our organization."
    },
    {
      name: "Michael Rodriguez",
      role: "Software Engineer",
      company: "StartupXYZ",
      avatar: "MR",
      text: "Finally, a platform that verifies my work experience. Got 3 job offers through their discovery system!"
    },
    {
      name: "Lisa Thompson",
      role: "Operations Manager",
      company: "Enterprise Corp",
      avatar: "LT",
      text: "The work diary verification system is game-changing. Complete transparency across all our departments."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Unified Navigation Header */}
      <UnifiedHeader currentPage="landing" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200" data-testid="badge-platform">
              <Zap className="w-4 h-4 mr-2" />
              The Complete Professional Networking & HRMS Platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6" data-testid="text-hero-title">
              Professional Credibility meets
              <span className="text-blue-600"> Work </span>
              Transparency
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto" data-testid="text-hero-description">
              Empower professionals with verified profiles and career growth while enabling enterprises 
              to manage complex hierarchical organizations with advanced work tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth?view=employee" data-testid="button-get-started-employee">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Get Started Free - For Professionals
                </Button>
              </Link>
              <Link href="/auth?view=company" data-testid="button-enterprise-solution">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg">
                  <Building className="w-5 h-5 mr-2" />
                  Enterprise Solution
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                Professional Profiles
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                Hierarchical Organizations
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                Work Tracking & Verification
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2" data-testid={`stat-number-${index}`}>
                  {stat.number}
                </div>
                <div className="text-slate-600" data-testid={`stat-label-${index}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" data-testid="text-features-title">
              One Platform, Three Powerful Ecosystems
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto" data-testid="text-features-description">
              Professionals build verified careers, enterprises manage complex organizations, and recruiters 
              connect talent with opportunities—all on one trusted platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* For Professionals */}
            <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-2xl text-slate-900" data-testid="text-professionals-title">
                      For Professionals
                    </CardTitle>
                    <CardDescription data-testid="text-professionals-description">
                      Build your career with verified credentials
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {professionalFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-slate-900" data-testid={`professional-feature-title-${index}`}>
                          {feature.title}
                        </h4>
                        <p className="text-slate-600 text-sm" data-testid={`professional-feature-desc-${index}`}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/auth?view=employee" className="block mt-6" data-testid="link-join-professional">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Join as Professional
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* For Enterprises */}
            <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-2xl text-slate-900" data-testid="text-enterprises-title">
                      For Enterprises
                    </CardTitle>
                    <CardDescription data-testid="text-enterprises-description">
                      Manage complex organizations at scale
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enterpriseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-slate-900" data-testid={`enterprise-feature-title-${index}`}>
                          {feature.title}
                        </h4>
                        <p className="text-slate-600 text-sm" data-testid={`enterprise-feature-desc-${index}`}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/auth?view=company" className="block mt-6" data-testid="link-register-company">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Register Your Company
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* For Recruiters */}
            <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-2xl text-slate-900" data-testid="text-recruiters-title">
                      For Recruiters
                    </CardTitle>
                    <CardDescription data-testid="text-recruiters-description">
                      Connect verified talent with opportunities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recruiterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-slate-900" data-testid={`recruiter-feature-title-${index}`}>
                          {feature.title}
                        </h4>
                        <p className="text-slate-600 text-sm" data-testid={`recruiter-feature-desc-${index}`}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/auth?view=employee" className="block mt-6" data-testid="link-join-recruiter">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Join as Recruiter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Focus Section */}
      <section id="enterprise" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200" data-testid="badge-enterprise">
              <Globe className="w-4 h-4 mr-2" />
              Built for Scale. Designed for Growth.
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" data-testid="text-enterprise-title">
              Enterprise-Grade Architecture
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto" data-testid="text-enterprise-description">
              From startups to Fortune 500 companies, our platform scales with your organization's complexity 
              while maintaining security and performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle data-testid="text-enterprise-security-title">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600" data-testid="text-enterprise-security-description">
                  Role-based access control, audit trails, and compliance-ready data protection 
                  for your most sensitive information.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Network className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle data-testid="text-complex-hierarchies-title">Complex Hierarchies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600" data-testid="text-complex-hierarchies-description">
                  Multi-level organizational structures with unlimited branches, teams, 
                  and custom role definitions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle data-testid="text-advanced-analytics-title">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600" data-testid="text-advanced-analytics-description">
                  Real-time performance monitoring, capacity tracking, and intelligent 
                  optimization recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" data-testid="text-testimonials-title">
              Trusted by Professionals and Enterprises Worldwide
            </h2>
            <p className="text-xl text-slate-600" data-testid="text-testimonials-description">
              See how Signedwork is transforming careers and organizations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6" data-testid={`testimonial-text-${index}`}>
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold text-slate-900" data-testid={`testimonial-name-${index}`}>
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-slate-600" data-testid={`testimonial-role-${index}`}>
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Transform Your Professional Network?
          </h2>
          <p className="text-xl text-blue-100 mb-8" data-testid="text-cta-description">
            Join thousands of professionals and hundreds of companies already using Signedwork 
            to build better careers and stronger organizations.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="bg-white text-slate-900">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle data-testid="text-professionals-card-title">For Professionals</CardTitle>
                <CardDescription data-testid="text-professionals-card-description">
                  Build your verified profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600">Free</div>
                  <div className="text-slate-600">Forever</div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Complete professional profile
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    AI-powered job discovery
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Work verification system
                  </div>
                </div>
                <Link href="/auth?view=employee" className="block" data-testid="link-join-professional-cta">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Join as Professional
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white text-slate-900">
              <CardHeader className="text-center">
                <Building className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle data-testid="text-enterprise-card-title">For Enterprises</CardTitle>
                <CardDescription data-testid="text-enterprise-card-description">
                  Custom organizational setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-purple-600">Custom</div>
                  <div className="text-slate-600">Contact sales</div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Unlimited hierarchy levels
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Advanced work tracking
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Enterprise support
                  </div>
                </div>
                <Link href="/auth?view=company" className="block" data-testid="link-enterprise-demo-cta">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Get Enterprise Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-blue-100 text-sm">
            No credit card required • Free professional accounts forever • Enterprise pricing available
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold">Signedwork</span>
              </div>
              <p className="text-slate-400 text-sm">
                The complete professional networking and enterprise work management platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/auth?view=employee" data-testid="footer-link-professionals">
                  <div className="hover:text-white cursor-pointer">For Professionals</div>
                </Link>
                <Link href="/auth?view=company" data-testid="footer-link-enterprises">
                  <div className="hover:text-white cursor-pointer">For Enterprises</div>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/about" data-testid="footer-link-about">
                  <div className="hover:text-white cursor-pointer">About</div>
                </Link>
                <Link href="/contact" data-testid="footer-link-contact">
                  <div className="hover:text-white cursor-pointer">Contact</div>
                </Link>
                <Link href="/support" data-testid="footer-link-support">
                  <div className="hover:text-white cursor-pointer">Support</div>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/privacy" data-testid="footer-link-privacy">
                  <div className="hover:text-white cursor-pointer">Privacy Policy</div>
                </Link>
                <Link href="/terms" data-testid="footer-link-terms">
                  <div className="hover:text-white cursor-pointer">Terms of Service</div>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            © 2024 Signedwork. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}