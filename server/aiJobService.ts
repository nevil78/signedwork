import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not found. AI features will be disabled.");
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

export interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  skills?: string[];
  experience?: string;
  education?: string;
  certifications?: string[];
  workHistory?: Array<{
    companyName: string;
    position?: string;
    description?: string;
    skills?: string[];
  }>;
  professionalSummary?: string;
  location?: string;
  preferredJobTypes?: string[];
  salaryExpectation?: string;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string;
  companyName: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  skills?: string[];
  salaryRange?: string;
  benefits?: string[];
}

export interface AIJobAnalysis {
  matchScore: number; // 0-100
  matchReasons: string[];
  skillsAlignment: {
    matching: string[];
    missing: string[];
    transferable: string[];
  };
  careerFitAnalysis: string;
  salaryAlignment: 'below' | 'match' | 'above' | 'unknown';
  locationFit: 'perfect' | 'good' | 'remote-possible' | 'relocate-needed';
  recommendationLevel: 'highly-recommended' | 'good-fit' | 'consider' | 'not-recommended';
}

export interface AIJobRecommendations {
  perfectMatches: Array<JobListing & { aiAnalysis: AIJobAnalysis }>;
  goodMatches: Array<JobListing & { aiAnalysis: AIJobAnalysis }>;
  careerGrowthOpportunities: Array<JobListing & { aiAnalysis: AIJobAnalysis }>;
  skillDevelopmentSuggestions: string[];
  careerPathRecommendations: string[];
}

export class AIJobService {
  private isEnabled(): boolean {
    return openai !== null;
  }

  /**
   * Analyze how well a job matches an employee's profile
   * PRIVACY: Only uses the current employee's data, never accesses other users' data
   */
  async analyzeJobMatch(employee: EmployeeProfile, job: JobListing): Promise<AIJobAnalysis> {
    if (!this.isEnabled()) {
      // Fallback basic matching when AI is disabled
      return this.basicJobMatch(employee, job);
    }

    try {
      const prompt = this.buildJobMatchPrompt(employee, job);
      
      const response = await openai!.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert career counselor and job matching specialist. Analyze job-candidate fit and provide detailed, actionable insights. Respond only in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.validateAndFormatAnalysis(result);
    } catch (error) {
      console.error("AI job analysis error:", error);
      return this.basicJobMatch(employee, job);
    }
  }

  /**
   * Get intelligent job recommendations for an employee
   * PRIVACY: Only analyzes the current employee's profile and available jobs
   */
  async getJobRecommendations(employee: EmployeeProfile, availableJobs: JobListing[]): Promise<AIJobRecommendations> {
    if (!this.isEnabled() || availableJobs.length === 0) {
      return this.basicJobRecommendations(employee, availableJobs);
    }

    try {
      // Analyze each job individually to respect rate limits and provide detailed analysis
      const analyzedJobs = await Promise.all(
        availableJobs.slice(0, 10) // Limit to first 10 jobs for cost efficiency
          .map(async (job) => ({
            ...job,
            aiAnalysis: await this.analyzeJobMatch(employee, job)
          }))
      );

      // Categorize jobs based on AI analysis
      const perfectMatches = analyzedJobs.filter(job => 
        job.aiAnalysis.recommendationLevel === 'highly-recommended' && 
        job.aiAnalysis.matchScore >= 80
      );

      const goodMatches = analyzedJobs.filter(job => 
        job.aiAnalysis.recommendationLevel === 'good-fit' && 
        job.aiAnalysis.matchScore >= 60
      );

      const careerGrowthOpportunities = analyzedJobs.filter(job => 
        job.aiAnalysis.recommendationLevel === 'consider' &&
        job.aiAnalysis.careerFitAnalysis.includes('growth') ||
        job.aiAnalysis.careerFitAnalysis.includes('development')
      );

      // Generate career insights
      const skillDevelopmentSuggestions = await this.generateSkillSuggestions(employee, analyzedJobs);
      const careerPathRecommendations = await this.generateCareerPathSuggestions(employee, analyzedJobs);

      return {
        perfectMatches,
        goodMatches,
        careerGrowthOpportunities,
        skillDevelopmentSuggestions,
        careerPathRecommendations
      };
    } catch (error) {
      console.error("AI job recommendations error:", error);
      return this.basicJobRecommendations(employee, availableJobs);
    }
  }

  /**
   * Generate intelligent search suggestions based on employee profile
   */
  async generateSmartSearchSuggestions(employee: EmployeeProfile): Promise<string[]> {
    if (!this.isEnabled()) {
      return this.basicSearchSuggestions(employee);
    }

    try {
      const prompt = `Based on this professional profile, suggest 5-8 relevant job search keywords that would help find the best matching opportunities:

Employee Profile:
- Name: ${employee.firstName} ${employee.lastName}
- Skills: ${employee.skills?.join(', ') || 'Not specified'}
- Experience: ${employee.experience || 'Not specified'}
- Professional Summary: ${employee.professionalSummary || 'Not specified'}
- Work History: ${employee.workHistory?.map(w => `${w.position} at ${w.companyName}`).join(', ') || 'Not specified'}

Provide search keywords that are:
1. Specific to their skill level and experience
2. Industry-relevant
3. Role-specific
4. Technology/skill focused
5. Career progression oriented

Respond in JSON format: {"suggestions": ["keyword1", "keyword2", ...]}`;

      const response = await openai!.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a career search expert. Generate specific, actionable job search keywords."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.suggestions || this.basicSearchSuggestions(employee);
    } catch (error) {
      console.error("AI search suggestions error:", error);
      return this.basicSearchSuggestions(employee);
    }
  }

  private buildJobMatchPrompt(employee: EmployeeProfile, job: JobListing): string {
    return `Analyze the match between this employee profile and job posting. Provide a detailed analysis in JSON format.

EMPLOYEE PROFILE:
- Name: ${employee.firstName} ${employee.lastName}
- Skills: ${employee.skills?.join(', ') || 'Not specified'}
- Experience: ${employee.experience || 'Not specified'}
- Education: ${employee.education || 'Not specified'}
- Certifications: ${employee.certifications?.join(', ') || 'None'}
- Professional Summary: ${employee.professionalSummary || 'Not specified'}
- Work History: ${employee.workHistory?.map(w => `${w.position || 'Unknown role'} at ${w.companyName} - ${w.description || 'No description'}`).join('\n') || 'No work history'}
- Location: ${employee.location || 'Not specified'}
- Preferred Job Types: ${employee.preferredJobTypes?.join(', ') || 'Not specified'}

JOB POSTING:
- Title: ${job.title}
- Company: ${job.companyName}
- Description: ${job.description}
- Requirements: ${job.requirements}
- Location: ${job.location}
- Employment Type: ${job.employmentType}
- Experience Level: ${job.experienceLevel}
- Required Skills: ${job.skills?.join(', ') || 'Not specified'}
- Salary Range: ${job.salaryRange || 'Not specified'}

Provide analysis in this exact JSON structure:
{
  "matchScore": number (0-100),
  "matchReasons": ["reason1", "reason2", "reason3"],
  "skillsAlignment": {
    "matching": ["skill1", "skill2"],
    "missing": ["skill1", "skill2"],
    "transferable": ["skill1", "skill2"]
  },
  "careerFitAnalysis": "detailed paragraph about career fit",
  "salaryAlignment": "below|match|above|unknown",
  "locationFit": "perfect|good|remote-possible|relocate-needed",
  "recommendationLevel": "highly-recommended|good-fit|consider|not-recommended"
}`;
  }

  private validateAndFormatAnalysis(result: any): AIJobAnalysis {
    return {
      matchScore: Math.min(100, Math.max(0, result.matchScore || 0)),
      matchReasons: Array.isArray(result.matchReasons) ? result.matchReasons.slice(0, 5) : [],
      skillsAlignment: {
        matching: Array.isArray(result.skillsAlignment?.matching) ? result.skillsAlignment.matching : [],
        missing: Array.isArray(result.skillsAlignment?.missing) ? result.skillsAlignment.missing : [],
        transferable: Array.isArray(result.skillsAlignment?.transferable) ? result.skillsAlignment.transferable : []
      },
      careerFitAnalysis: result.careerFitAnalysis || "Analysis not available",
      salaryAlignment: ['below', 'match', 'above', 'unknown'].includes(result.salaryAlignment) 
        ? result.salaryAlignment : 'unknown',
      locationFit: ['perfect', 'good', 'remote-possible', 'relocate-needed'].includes(result.locationFit)
        ? result.locationFit : 'good',
      recommendationLevel: ['highly-recommended', 'good-fit', 'consider', 'not-recommended'].includes(result.recommendationLevel)
        ? result.recommendationLevel : 'consider'
    };
  }

  private async generateSkillSuggestions(employee: EmployeeProfile, jobs: Array<JobListing & { aiAnalysis: AIJobAnalysis }>): Promise<string[]> {
    try {
      const allMissingSkills = jobs.flatMap(job => job.aiAnalysis.skillsAlignment.missing);
      const skillCounts = allMissingSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topMissingSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([skill]) => skill);

      return topMissingSkills.length > 0 
        ? [`Consider learning: ${topMissingSkills.join(', ')} to improve job match rates`]
        : ['Continue developing your existing skills to stay competitive'];
    } catch (error) {
      return ['Focus on continuous skill development in your field'];
    }
  }

  private async generateCareerPathSuggestions(employee: EmployeeProfile, jobs: Array<JobListing & { aiAnalysis: AIJobAnalysis }>): Promise<string[]> {
    const suggestions = [];
    
    const perfectMatches = jobs.filter(job => job.aiAnalysis.recommendationLevel === 'highly-recommended');
    const growthOpportunities = jobs.filter(job => job.aiAnalysis.careerFitAnalysis.includes('growth'));

    if (perfectMatches.length > 0) {
      suggestions.push('You have strong matches available - consider applying to highly recommended positions');
    }

    if (growthOpportunities.length > 0) {
      suggestions.push('Several roles offer excellent career growth potential');
    }

    if (suggestions.length === 0) {
      suggestions.push('Continue building your profile and skills to access better opportunities');
    }

    return suggestions;
  }

  // Fallback methods when AI is not available
  private basicJobMatch(employee: EmployeeProfile, job: JobListing): AIJobAnalysis {
    const employeeSkills = employee.skills || [];
    const jobSkills = job.skills || [];
    
    const matchingSkills = employeeSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    const matchScore = jobSkills.length > 0 
      ? Math.round((matchingSkills.length / jobSkills.length) * 100)
      : 50;

    return {
      matchScore,
      matchReasons: matchingSkills.length > 0 
        ? [`${matchingSkills.length} matching skills found`]
        : ['Basic profile compatibility'],
      skillsAlignment: {
        matching: matchingSkills,
        missing: jobSkills.filter(skill => !matchingSkills.includes(skill)),
        transferable: []
      },
      careerFitAnalysis: "Basic compatibility analysis - enable AI for detailed insights",
      salaryAlignment: 'unknown',
      locationFit: 'good',
      recommendationLevel: matchScore >= 70 ? 'good-fit' : 'consider'
    };
  }

  private basicJobRecommendations(employee: EmployeeProfile, jobs: JobListing[]): AIJobRecommendations {
    const analyzedJobs = jobs.map(job => ({
      ...job,
      aiAnalysis: this.basicJobMatch(employee, job)
    }));

    return {
      perfectMatches: analyzedJobs.filter(job => job.aiAnalysis.matchScore >= 80).slice(0, 5),
      goodMatches: analyzedJobs.filter(job => job.aiAnalysis.matchScore >= 60).slice(0, 8),
      careerGrowthOpportunities: analyzedJobs.slice(0, 3),
      skillDevelopmentSuggestions: ['Continue developing your professional skills'],
      careerPathRecommendations: ['Explore opportunities that match your experience level']
    };
  }

  private basicSearchSuggestions(employee: EmployeeProfile): string[] {
    const suggestions = [];
    
    if (employee.skills && employee.skills.length > 0) {
      suggestions.push(...employee.skills.slice(0, 3));
    }
    
    if (employee.workHistory && employee.workHistory.length > 0) {
      const positions = employee.workHistory
        .map(w => w.position)
        .filter(Boolean)
        .slice(0, 2);
      suggestions.push(...positions);
    }

    return suggestions.length > 0 ? suggestions : ['software', 'management', 'development'];
  }
}

export const aiJobService = new AIJobService();