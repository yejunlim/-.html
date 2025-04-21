using UnityEngine;

public class Projectile : MonoBehaviour
{
    [SerializeField] private float baseDamage = 10f;
    [SerializeField] private GameObject hitEffect;
    
    private float damageMultiplier = 1f;
    private bool isEnemyProjectile = false;
    
    public void SetDamage(float damage)
    {
        baseDamage = damage;
    }
    
    public void SetDamageMultiplier(float multiplier)
    {
        damageMultiplier = multiplier;
    }
    
    public void SetAsEnemyProjectile(bool isEnemy)
    {
        isEnemyProjectile = isEnemy;
    }
    
    void OnCollisionEnter2D(Collision2D collision)
    {
        // 적의 발사체는 플레이어만 공격
        if (isEnemyProjectile)
        {
            if (collision.gameObject.CompareTag("Player"))
            {
                Health health = collision.gameObject.GetComponent<Health>();
                if (health != null)
                {
                    health.TakeDamage(baseDamage * damageMultiplier);
                }
            }
        }
        // 플레이어의 발사체는 적만 공격
        else
        {
            if (collision.gameObject.CompareTag("Enemy"))
            {
                Health health = collision.gameObject.GetComponent<Health>();
                if (health != null)
                {
                    health.TakeDamage(baseDamage * damageMultiplier);
                }
            }
        }
        
        // 충돌 이펙트 생성
        if (hitEffect != null)
        {
            Instantiate(hitEffect, transform.position, Quaternion.identity);
        }
        
        Destroy(gameObject);
    }
}