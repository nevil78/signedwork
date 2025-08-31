import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Building2, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  ArrowLeft,
  Star,
  Award,
  Languages,
  BookOpen,
  Phone
} from 'lucide-react';
import type { Employee } from '@shared/schema';

export default function CompanyEmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [, setLocation] = useLocation();

  const { data: employee, isLoading: employeeLoading, error: employeeError } = useQuery<Employee>({
    queryKey: ['/api/company/employee', employeeId],
    enabled: !!employeeId
  });

  // Get employee experience, education, and certifications
  const { data: experiences = [] } = useQuery<any[]>({
    queryKey: ['/api/company/employee-experience', employeeId],
    enabled: !!employeeId
  });

  const { data: educations = [] } = useQuery<any[]>({
    queryKey: ['/api/company/employee-education', employeeId],
    enabled: !!employeeId
  });

  const { data: certifications = [] } = useQuery<any[]>({
    queryKey: ['/api/company/employee-certifications', employeeId],
    enabled: !!employeeId
  });

  if (employeeLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (employeeError || !employee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This employee is not associated with your company or doesn't exist.
              </p>
              <Button onClick={() => setLocation('/company-recruiter')} data-testid="button-back-recruiter">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recruiter Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/company-recruiter')}
              data-testid="button-back-recruiter"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recruiter
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Employee Profile</h1>
              <p className="text-muted-foreground">Read-only professional view</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Company View
          </Badge>
        </div>

        {/* Employee Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {employee.profilePhoto ? (
                  <img 
                    src={employee.profilePhoto} 
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-muted"
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-employee-name">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    {employee.employeeId && (
                      <p className="text-sm text-muted-foreground font-mono">
                        ID: {employee.employeeId}
                      </p>
                    )}
                    {employee.headline && (
                      <p className="text-lg text-muted-foreground mt-1" data-testid="text-employee-headline">
                        {employee.headline}
                      </p>
                    )}
                    {employee.currentPosition && (
                      <div className="flex items-center gap-2 mt-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {employee.currentPosition}
                          {employee.currentCompany && ` at ${employee.currentCompany}`}
                        </span>
                      </div>
                    )}
                    {employee.industry && (
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employee.industry}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info (Professional Only) */}
                  <div className="text-sm text-muted-foreground">
                    <p data-testid="text-employee-email">{employee.email}</p>
                    {employee.phone && (
                      <p data-testid="text-employee-phone">{employee.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        {employee.summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-employee-summary">
                {employee.summary}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {employee.languages && employee.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.languages.map((language: string, index: number) => (
                    <Badge key={index} variant="outline" data-testid={`badge-language-${index}`}>
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Achievements */}
          {employee.achievements && employee.achievements.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Key Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {employee.achievements.map((achievement: string, index: number) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`text-achievement-${index}`}>
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Basic Details */}
          {(employee.phone || employee.dateOfBirth || employee.gender) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employee.phone && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Mobile Number</span>
                      <p className="text-gray-900 dark:text-gray-100">{employee.phone}</p>
                    </div>
                  )}
                  
                  {employee.dateOfBirth && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Date of Birth</span>
                      <p className="text-gray-900 dark:text-gray-100">{new Date(employee.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {employee.gender && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Gender</span>
                      <p className="text-gray-900 dark:text-gray-100 capitalize">{employee.gender.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Links */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Professional Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {employee.website && (
                  <a 
                    href={employee.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors"
                    data-testid="link-website"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Website</span>
                  </a>
                )}
                {employee.portfolioUrl && (
                  <a 
                    href={employee.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors"
                    data-testid="link-portfolio"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">Portfolio</span>
                  </a>
                )}
                {employee.githubUrl && (
                  <a 
                    href={employee.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors"
                    data-testid="link-github"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
                {employee.linkedinUrl && (
                  <a 
                    href={employee.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors"
                    data-testid="link-linkedin"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
              </div>
              
              {!employee.website && !employee.portfolioUrl && !employee.githubUrl && !employee.linkedinUrl && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No professional links available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Contact & Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm text-muted-foreground">
                    {employee.countryCode} {employee.phone}
                  </span>
                </div>
              )}
              {employee.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.location}</span>
                </div>
              )}
              {(employee.address || employee.city || employee.state || employee.country) && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Address:</span>
                  <div className="text-sm text-muted-foreground">
                    {employee.address && <div>{employee.address}</div>}
                    {(employee.city || employee.state || employee.zipCode) && (
                      <div>
                        {[employee.city, employee.state, employee.zipCode].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {employee.country && <div>{employee.country}</div>}
                  </div>
                </div>
              )}
              {employee.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Born: {employee.dateOfBirth}</span>
                </div>
              )}
              {employee.nationality && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Nationality:</span>
                  <span className="text-sm text-muted-foreground">{employee.nationality}</span>
                </div>
              )}
              {employee.maritalStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Marital Status:</span>
                  <span className="text-sm text-muted-foreground">{employee.maritalStatus}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hobbies & Interests */}
          {employee.hobbies && employee.hobbies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Hobbies & Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.hobbies.map((hobby: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Experience Section */}
        {experiences.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experiences.map((exp: any, index: number) => (
                  <div key={exp.id} className="border-l-2 border-muted pl-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{exp.title}</h3>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        {exp.location && (
                          <p className="text-xs text-muted-foreground">{exp.location}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{exp.description}</p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div className="mt-2">
                        <ul className="text-xs space-y-1">
                          {exp.achievements.map((achievement: string, achIndex: number) => (
                            <li key={achIndex} className="flex items-start gap-1">
                              <span className="text-muted-foreground">•</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education Section */}
        {educations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {educations.map((edu: any, index: number) => (
                  <div key={edu.id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{edu.degree}</h3>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-xs text-muted-foreground">{edu.fieldOfStudy}</p>
                        )}
                        {edu.grade && (
                          <p className="text-xs text-muted-foreground">Grade: {edu.grade}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {edu.startYear} - {edu.endYear || 'Present'}
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{edu.description}</p>
                    )}
                    {edu.activities && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        Activities: {edu.activities}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.map((cert: any, index: number) => (
                  <div key={cert.id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                        {cert.credentialId && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {cert.credentialId}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {cert.issueDate}
                        {cert.expiryDate && (
                          <div>Expires: {cert.expiryDate}</div>
                        )}
                      </div>
                    </div>
                    {cert.description && (
                      <p className="text-sm mt-2 text-muted-foreground">{cert.description}</p>
                    )}
                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        Verify Certificate →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Online Presence - Twitter */}
        {employee.twitterUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="h-5 w-5" />
                Additional Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={employee.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                data-testid="link-twitter"
              >
                <Twitter className="h-4 w-4" />
                Twitter Profile
              </a>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Comprehensive Professional Profile
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This company view shows the employee's complete professional information including personal details, experience, education, certifications, and skills as provided by the employee.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}