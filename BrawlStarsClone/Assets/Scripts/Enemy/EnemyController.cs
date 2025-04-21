using UnityEngine;

public class EnemyController : MonoBehaviour
{
    [SerializeField] private float detectionRange = 10f;
    [SerializeField] private float attackRange = 5f;
    [SerializeField] private float moveSpeed = 3f;
    [SerializeField] private float attackCooldown = 2f;
    [SerializeField] private float damage = 10f;
    [SerializeField] private GameObject projectilePrefab;
    
    private Transform player;
    private Rigidbody2D rb;
    private float nextAttackTime;
    private Health health;
    
    void Start()
    {
        player = GameObject.FindGameObjectWithTag("Player").transform;
        rb = GetComponent<Rigidbody2D>();
        health = GetComponent<Health>();
    }
    
    void Update()
    {
        if (player == null) return;
        
        float distanceToPlayer = Vector2.Distance(transform.position, player.position);
        
        // 플레이어가 감지 범위 안에 있을 때
        if (distanceToPlayer <= detectionRange)
        {
            // 플레이어 방향으로 회전
            Vector2 direction = ((Vector2)player.position - (Vector2)transform.position).normalized;
            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.Lerp(transform.rotation,
                Quaternion.Euler(0, 0, angle),
                Time.deltaTime * 5f);
            
            // 공격 범위 안에 있으면 공격
            if (distanceToPlayer <= attackRange)
            {
                if (Time.time >= nextAttackTime)
                {
                    Attack();
                    nextAttackTime = Time.time + attackCooldown;
                }
            }
            // 공격 범위 밖에 있으면 추적
            else
            {
                rb.MovePosition(Vector2.MoveTowards(
                    rb.position,
                    player.position,
                    moveSpeed * Time.fixedDeltaTime
                ));
            }
        }
    }
    
    void Attack()
    {
        // 프로젝타일 발사
        Vector2 direction = ((Vector2)player.position - (Vector2)transform.position).normalized;
        GameObject projectile = Instantiate(projectilePrefab, transform.position, transform.rotation);
        Rigidbody2D projectileRb = projectile.GetComponent<Rigidbody2D>();
        
        if (projectileRb != null)
        {
            projectileRb.velocity = direction * 10f;
        }
        
        Projectile projectileScript = projectile.GetComponent<Projectile>();
        if (projectileScript != null)
        {
            projectileScript.SetDamage(damage);
        }
        
        Destroy(projectile, 3f);
    }
    
    void OnDrawGizmosSelected()
    {
        // 감지 범위와 공격 범위를 시각화
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, detectionRange);
        
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, attackRange);
    }
}