using Xunit;

namespace VigilCI.Core.Tests;

public class UnitTest1
{
    [PerformanceTest(2)]
    public void Test1()
    {
        Thread.Sleep(6000);

        using (PerfTimer.Measure("2"))
        {
            Thread.Sleep(4000);
        }
        
        Assert.Equal(1, 1);
    }
    
    [PerformanceTest(2)]
    public void Test2()
    {
        Thread.Sleep(1000);

        using (PerfTimer.Measure("2"))
        {
            Thread.Sleep(1000);
        }
        
        Assert.Equal(1, 1);
    }
}
