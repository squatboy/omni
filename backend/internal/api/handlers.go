package api

import (
	"net/http"
	"omni-backend/internal/collector"

	"github.com/gin-gonic/gin"
)

func SetupRouter(cache *collector.Cache, runner *collector.Runner) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/collect")
	{
		api.GET("/snapshot", func(c *gin.Context) {
			if c.Query("force") == "true" && runner != nil {
				runner.CollectOnce(c.Request.Context())
			}
			c.JSON(http.StatusOK, cache.GetSnapshot())
		})
		api.GET("/vms", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetVMs())
		})
		api.GET("/kubernetes", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetKubernetes())
		})
		api.GET("/argocd", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetArgoCD())
		})
		api.GET("/gitlab", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetGitLab())
		})
		api.GET("/nexus", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetNexus())
		})
		api.GET("/overview", func(c *gin.Context) {
			c.JSON(http.StatusOK, cache.GetOverview())
		})
	}

	r.GET("/health/ready", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return r
}
